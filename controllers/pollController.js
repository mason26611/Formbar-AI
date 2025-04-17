const Poll = require('../models/Poll');
const Class = require('../models/Class');
const User = require('../models/User');
const PollResponse = require('../models/PollResponse');

// @desc    Create a new poll
// @route   POST /api/polls
// @access  Private (Teacher)
exports.createPoll = async (req, res) => {
  try {
    const { question, options, classId } = req.body;

    // First check if the class exists
    const class_ = await Class.findByPk(classId);
    if (!class_) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Then verify the user is the teacher of the class
    if (class_.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'You are not the teacher of this class' });
    }

    // Format options for storage
    const formattedOptions = options.map(text => ({
      text,
      votes: 0
    }));

    const poll = await Poll.create({
      question,
      options: formattedOptions,
      classId,
      teacherId: req.user.id
    });

    // Include associations in response
    const pollWithAssociations = await Poll.findByPk(poll.id, {
      include: [
        {
          model: User,
          as: 'respondents',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(201).json(pollWithAssociations);
  } catch (error) {
    console.error('Create poll error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get polls for a class
// @route   GET /api/polls/class/:classId
// @access  Private
exports.getPollsByClass = async (req, res) => {
  try {
    const polls = await Poll.findAll({
      where: { classId: req.params.classId },
      include: [
        {
          model: User,
          as: 'respondents',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(polls);
  } catch (error) {
    console.error('Get polls error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Submit a poll response
// @route   POST /api/polls/:pollId/respond
// @access  Private (Student)
exports.submitResponse = async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const pollId = req.params.pollId;

    // Debug log
    console.log('Submitting response:', { 
      pollId, 
      optionIndex, 
      body: req.body,
      userId: req.user.id 
    });

    // Validate optionIndex
    if (optionIndex === undefined || optionIndex === null) {
      return res.status(400).json({ message: 'Option index is required' });
    }

    // Check if poll exists and is active
    const poll = await Poll.findByPk(pollId);
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }
    if (!poll.isActive) {
      return res.status(400).json({ message: 'Poll is not active' });
    }

    // Check if student has already responded
    const existingResponse = await PollResponse.findOne({
      where: {
        pollId,
        studentId: req.user.id
      }
    });

    // If the student has already responded, update their response
    if (existingResponse) {
      // Get previous option index to adjust counts
      const previousOptionIndex = existingResponse.optionIndex;
      
      // Update options count - decrement old choice
      const options = [...poll.options];
      if (options[previousOptionIndex] && options[previousOptionIndex].votes > 0) {
        options[previousOptionIndex].votes -= 1;
      }
      
      // Increment new choice
      options[optionIndex].votes += 1;
      
      // Update poll options
      await poll.update({ options });
      
      // Update student response
      await existingResponse.update({ optionIndex });
    } else {
      // Create new response
      await PollResponse.create({
        pollId,
        studentId: req.user.id,
        optionIndex
      });

      // Update poll options votes
      const options = [...poll.options];
      options[optionIndex].votes += 1;
      await poll.update({ options });
    }

    // Emit socket event if Socket.IO is available
    if (req.io) {
      req.io.emit('newAnswer', {
        pollId,
        optionIndex,
        studentId: req.user.id
      });
    }

    res.json({ message: 'Response submitted successfully' });
  } catch (error) {
    console.error('Submit response error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Toggle poll active status
// @route   PATCH /api/polls/:pollId/toggle
// @access  Private (Teacher)
exports.togglePoll = async (req, res) => {
  try {
    const poll = await Poll.findByPk(req.params.pollId);
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    await poll.update({ isActive: !poll.isActive });

    res.json(poll);
  } catch (error) {
    console.error('Toggle poll error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get poll by ID
// @route   GET /api/polls/:id
// @access  Private
exports.getPollById = async (req, res) => {
  try {
    const poll = await Poll.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'respondents',
          attributes: ['id', 'name', 'email']
        },
        {
          model: PollResponse,
          as: 'responses'
        }
      ]
    });

    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    res.json(poll);
  } catch (error) {
    console.error('Get poll error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 