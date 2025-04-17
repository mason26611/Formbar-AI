const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ClassStudents = sequelize.define('ClassStudents', {
  classId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'Classes',
      key: 'id'
    }
  },
  studentId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['classId', 'studentId']
    }
  ]
});

module.exports = ClassStudents; 