const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PollResponse = sequelize.define('PollResponse', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  pollId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Polls',
      key: 'id'
    }
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  optionIndex: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['pollId', 'studentId']
    }
  ]
});

// Define associations
PollResponse.associate = (models) => {
  PollResponse.belongsTo(models.Poll, {
    foreignKey: 'pollId',
    as: 'poll'
  });
  PollResponse.belongsTo(models.User, {
    foreignKey: 'studentId',
    as: 'student'
  });
};

module.exports = PollResponse; 