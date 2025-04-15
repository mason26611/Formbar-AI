const Class = require('../models/Class');
const User = require('../models/User');
const Poll = require('../models/Poll');

// @desc    Get all classes for current user
// @route   GET /api/classes
// @access  Private
const getClasses = async (req, res) => {
  try {
    let classes;
    if (req.user.role === 'teacher' || req.user.role === 'manager') {
      // Get classes where user is teacher
      classes = await Class.findAll({
        where: { teacherId: req.user.id },
        include: [
          {
            model: User,
            as: 'students',
            attributes: ['id', 'name', 'email']
          },
          {
            model: User,
            as: 'teacher',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Poll,
            as: 'polls',
            attributes: ['id']
          }
        ]
      });
    } else {
      // Get classes where user is student
      classes = await Class.findAll({
        include: [
          {
            model: User,
            as: 'students',
            where: { id: req.user.id },
            attributes: []
          },
          {
            model: User,
            as: 'teacher',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Poll,
            as: 'polls',
            attributes: ['id']
          }
        ]
      });
    }

    // Transform the data to include counts
    const transformedClasses = classes.map(class_ => ({
      ...class_.toJSON(),
      studentCount: class_.students?.length || 0,
      pollCount: class_.polls?.length || 0,
      isEnrolled: true
    }));

    res.json(transformedClasses);
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to generate a random class code
const generateClassCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

// @desc    Create a new class
// @route   POST /api/classes
// @access  Private (Teacher/Manager)
const createClass = async (req, res) => {
  try {
    const { name, subject } = req.body;

    // Generate a unique code
    let code;
    let isUnique = false;
    while (!isUnique) {
      code = generateClassCode();
      const existingClass = await Class.findOne({ where: { code } });
      if (!existingClass) {
        isUnique = true;
      }
    }

    const newClass = await Class.create({
      name,
      subject,
      code,
      teacherId: req.user.id
    });

    res.status(201).json(newClass);
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get teacher's classes
// @route   GET /api/classes/teacher
// @access  Private (Teacher)
const getTeacherClasses = async (req, res) => {
  try {
    const classes = await Class.findAll({
      where: { teacherId: req.user.id },
      include: [
        {
          model: User,
          as: 'students',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Poll,
          as: 'polls',
          attributes: ['id']
        }
      ]
    });

    res.json(classes);
  } catch (error) {
    console.error('Get teacher classes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get student's classes
// @route   GET /api/classes/student
// @access  Private (Student)
const getStudentClasses = async (req, res) => {
  try {
    const classes = await Class.findAll({
      include: [
        {
          model: User,
          as: 'students',
          where: { id: req.user.id },
          attributes: []
        },
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Poll,
          as: 'polls',
          attributes: ['id']
        }
      ]
    });

    res.json(classes);
  } catch (error) {
    console.error('Get student classes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Join a class
// @route   POST /api/classes/join
// @access  Private (Student)
const joinClass = async (req, res) => {
  try {
    const { classId } = req.body;
    const classData = await Class.findByPk(classId);
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }
    await classData.addStudent(req.user.id);
    res.json({ message: 'Successfully joined class' });
  } catch (error) {
    console.error('Join class error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get class by ID
// @route   GET /api/classes/:id
// @access  Private
const getClassById = async (req, res) => {
  try {
    const classData = await Class.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'students',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Poll,
          as: 'polls',
          include: [
            {
              model: User,
              as: 'respondents',
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ]
    });

    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    res.json(classData);
  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getClasses,
  createClass,
  getTeacherClasses,
  getStudentClasses,
  joinClass,
  getClassById
}; 