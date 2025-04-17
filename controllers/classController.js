const Class = require('../models/Class');
const User = require('../models/User');
const Poll = require('../models/Poll');
const PollResponse = require('../models/PollResponse');
const ClassStudents = require('../models/ClassStudents');
const sequelize = require('../config/database');

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
    const { classId, classCode } = req.body;
    
    let classData;
    
    if (classId) {
      classData = await Class.findByPk(classId);
    } else if (classCode) {
      classData = await Class.findOne({ where: { code: classCode } });
    } else {
      return res.status(400).json({ message: 'Class ID or class code is required' });
    }
    
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Check if user is already a student in this class
    const isAlreadyEnrolled = await classData.hasStudent(req.user.id);
    if (isAlreadyEnrolled) {
      return res.status(400).json({ message: 'You are already enrolled in this class' });
    }
    
    // Use try/catch to handle potential errors during the addStudent operation
    try {
      // More direct approach using ClassStudents model
      const ClassStudents = sequelize.model('ClassStudents');
      await ClassStudents.create({
        classId: classData.id,
        studentId: req.user.id
      });
      
      res.json({ 
        message: 'Successfully joined class', 
        classId: classData.id 
      });
    } catch (joinError) {
      console.error('Error joining class:', joinError);
      
      // Check if it's a unique constraint error (student already in class)
      if (joinError.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ message: 'You are already enrolled in this class' });
      }
      
      throw joinError; // Re-throw to be caught by outer catch
    }
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
            },
            {
              model: PollResponse,
              as: 'responses'
            }
          ]
        }
      ]
    });

    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check access rights
    const isTeacher = classData.teacherId === req.user.id;
    const isStudent = classData.students.some(student => student.id === req.user.id);
    
    // If user is neither teacher nor enrolled student, deny access
    if (req.user.role === 'student' && !isStudent) {
      return res.status(403).json({ 
        message: 'You are not enrolled in this class',
        notEnrolled: true
      });
    }
    
    if (req.user.role === 'teacher' && !isTeacher) {
      return res.status(403).json({ 
        message: 'You are not authorized to access this class',
        notAuthorized: true
      });
    }

    res.json(classData);
  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Remove a student from a class
// @route   DELETE /api/classes/:classId/students/:studentId
// @access  Private (Teacher)
const removeStudent = async (req, res) => {
  try {
    const { classId, studentId } = req.params;
    
    // Check if the class exists
    const classObj = await Class.findByPk(classId);
    if (!classObj) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Verify the user is the teacher of the class
    if (classObj.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to remove students from this class' });
    }
    
    // Check if the student is in the class
    const classStudent = await ClassStudents.findOne({
      where: {
        classId,
        studentId
      }
    });
    
    if (!classStudent) {
      return res.status(404).json({ message: 'Student not found in this class' });
    }
    
    // Remove the student from the class
    await classStudent.destroy();
    
    // Emit socket event to notify the removed student
    if (req.io) {
      console.log(`Emitting studentRemoved event to class-${classId} for student ${studentId}`);
      req.io.to(`class-${classId}`).emit('studentRemoved', {
        classId,
        studentId,
        message: 'You have been removed from this class'
      });
    }
    
    res.json({ message: 'Student removed from class successfully' });
  } catch (error) {
    console.error('Remove student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Regenerate class join code
// @route   POST /api/classes/:id/regenerate-code
// @access  Private (Teacher)
const regenerateClassCode = async (req, res) => {
  try {
    const classId = req.params.id;
    
    // Check if the class exists
    const classObj = await Class.findByPk(classId);
    if (!classObj) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Verify the user is the teacher of the class
    if (classObj.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to regenerate the class code' });
    }
    
    // Generate a new unique code
    let newCode;
    let isCodeUnique = false;
    
    while (!isCodeUnique) {
      // Generate a 6-character alphanumeric code
      newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Check if the code is already in use
      const existingClass = await Class.findOne({ where: { code: newCode } });
      if (!existingClass) {
        isCodeUnique = true;
      }
    }
    
    // Update the class with the new code
    await classObj.update({ code: newCode });
    
    res.json({ 
      message: 'Class code regenerated successfully',
      code: newCode
    });
  } catch (error) {
    console.error('Regenerate class code error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getClasses,
  createClass,
  getTeacherClasses,
  getStudentClasses,
  joinClass,
  getClassById,
  removeStudent,
  regenerateClassCode
}; 