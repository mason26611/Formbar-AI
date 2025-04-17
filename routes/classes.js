const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { verifyTeacher } = require('../middleware/verifyTeacher');
const {
  createClass,
  getClasses,
  getTeacherClasses,
  getStudentClasses,
  joinClass,
  getClassById,
  removeStudent,
  regenerateClassCode
} = require('../controllers/classController');

// Get all classes for current user
router.get('/', auth, getClasses);

// Create a new class
router.post('/', auth, verifyTeacher, createClass);

// Get teacher's classes
router.get('/teacher', auth, verifyTeacher, getTeacherClasses);

// Get student's classes
router.get('/student', auth, getStudentClasses);

// Join a class
router.post('/join', auth, joinClass);

// Get class by ID
router.get('/:id', auth, getClassById);

// Remove a student from a class
router.delete('/:classId/students/:studentId', auth, removeStudent);

// Regenerate class code
router.post('/:id/regenerate-code', auth, regenerateClassCode);

module.exports = router; 