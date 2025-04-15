const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Poll = sequelize.define('Poll', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  question: {
    type: DataTypes.STRING,
    allowNull: false
  },
  options: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  classId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Classes',
      key: 'id'
    }
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

// Define associations
Poll.associate = (models) => {
  Poll.belongsTo(models.Class, { 
    foreignKey: 'classId',
    as: 'class'
  });
  Poll.belongsTo(models.User, {
    foreignKey: 'teacherId',
    as: 'teacher'
  });
  Poll.belongsToMany(models.User, {
    through: models.PollResponse,
    as: 'respondents',
    foreignKey: 'pollId',
    otherKey: 'studentId'
  });
  Poll.hasMany(models.PollResponse, {
    foreignKey: 'pollId',
    as: 'responses'
  });
};

module.exports = Poll; 