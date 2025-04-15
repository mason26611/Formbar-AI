const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const authRoutes = require('./routes/auth');
const classRoutes = require('./routes/classes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// SQLite Database Setup
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    // Create tables if they don't exist
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT,
        name TEXT,
        role TEXT,
        avatar TEXT
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        subject TEXT,
        teacher_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES users(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS class_students (
        class_id INTEGER,
        student_id INTEGER,
        PRIMARY KEY (class_id, student_id),
        FOREIGN KEY (class_id) REFERENCES classes(id),
        FOREIGN KEY (student_id) REFERENCES users(id)
      )`);
    });
  }
});

// Make db available to routes
app.locals.db = db;

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 