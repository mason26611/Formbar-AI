const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Class = sequelize.define('Class', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  timestamps: true
});

// Define associations after model definition
Class.associate = (models) => {
  Class.belongsTo(models.User, { 
    as: 'teacher', 
    foreignKey: 'teacherId' 
  });
  Class.belongsToMany(models.User, { 
    through: 'ClassStudents',
    as: 'students',
    foreignKey: 'classId',
    otherKey: 'studentId'
  });
  Class.hasMany(models.Poll, {
    foreignKey: 'classId',
    as: 'polls'
  });
};

module.exports = Class; 