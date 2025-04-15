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

    if (existingResponse) {
      return res.status(400).json({ message: 'You have already responded to this poll' });
    }

    // Create response
    await PollResponse.create({
      pollId,
      studentId: req.user.id,
      optionIndex
    });

    // Update poll options votes
    const options = [...poll.options];
    options[optionIndex].votes += 1;
    await poll.update({ options });

    // Emit socket event
    req.io.emit('newAnswer', {
      pollId,
      optionIndex,
      studentId: req.user.id
    });

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