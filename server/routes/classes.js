const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get all classes
router.get('/', auth, async (req, res) => {
  const db = req.app.locals.db;
  
  db.all(`
    SELECT c.*, u.name as teacher_name, u.avatar as teacher_avatar,
    (SELECT COUNT(*) FROM class_students WHERE class_id = c.id) as student_count
    FROM classes c
    JOIN users u ON c.teacher_id = u.id
    LEFT JOIN class_students cs ON c.id = cs.class_id
    GROUP BY c.id
  `, [], (err, classes) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }
    res.json(classes);
  });
});

// Create a new class
router.post('/', auth, async (req, res) => {
  const db = req.app.locals.db;
  const { name, subject } = req.body;
  
  db.run(
    'INSERT INTO classes (name, subject, teacher_id) VALUES (?, ?, ?)',
    [name, subject, req.user.id],
    function(err) {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      
      db.get(
        'SELECT c.*, u.name as teacher_name, u.avatar as teacher_avatar FROM classes c JOIN users u ON c.teacher_id = u.id WHERE c.id = ?',
        [this.lastID],
        (err, newClass) => {
          if (err) {
            return res.status(500).json({ message: err.message });
          }
          res.status(201).json(newClass);
        }
      );
    }
  );
});

// Join a class
router.post('/:id/join', auth, async (req, res) => {
  const db = req.app.locals.db;
  const classId = req.params.id;
  
  // Check if already enrolled
  db.get(
    'SELECT * FROM class_students WHERE class_id = ? AND student_id = ?',
    [classId, req.user.id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ message: err.message });
      }
      
      if (row) {
        return res.status(400).json({ message: 'Already enrolled in this class' });
      }
      
      // Enroll student
      db.run(
        'INSERT INTO class_students (class_id, student_id) VALUES (?, ?)',
        [classId, req.user.id],
        (err) => {
          if (err) {
            return res.status(500).json({ message: err.message });
          }
          
          // Get updated class info
          db.get(`
            SELECT c.*, u.name as teacher_name, u.avatar as teacher_avatar,
            (SELECT COUNT(*) FROM class_students WHERE class_id = c.id) as student_count
            FROM classes c
            JOIN users u ON c.teacher_id = u.id
            WHERE c.id = ?
          `, [classId], (err, classItem) => {
            if (err) {
              return res.status(500).json({ message: err.message });
            }
            res.json(classItem);
          });
        }
      );
    }
  );
});

// Get a specific class
router.get('/:id', auth, async (req, res) => {
  const db = req.app.locals.db;
  const classId = req.params.id;
  
  db.get(`
    SELECT c.*, u.name as teacher_name, u.avatar as teacher_avatar,
    (SELECT COUNT(*) FROM class_students WHERE class_id = c.id) as student_count
    FROM classes c
    JOIN users u ON c.teacher_id = u.id
    WHERE c.id = ?
  `, [classId], (err, classItem) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }
    res.json(classItem);
  });
});

module.exports = router; 