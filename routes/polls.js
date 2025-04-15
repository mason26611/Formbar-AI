const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createPoll, getPollsByClass, submitResponse, togglePoll, getPollById } = require('../controllers/pollController');

// Middleware to verify teacher/manager role
const verifyTeacher = async (req, res, next) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error verifying role' });
  }
};

// Create a new poll
router.post('/', auth, verifyTeacher, createPoll);

// Get polls for a class
router.get('/class/:classId', auth, getPollsByClass);

// Submit a response to a poll
router.post('/:pollId/respond', auth, submitResponse);

// Toggle poll active status
router.patch('/:pollId/toggle', auth, verifyTeacher, togglePoll);

// Get poll by ID
router.get('/:id', auth, getPollById);

module.exports = router; 