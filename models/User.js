const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('manager', 'teacher', 'student'),
    allowNull: false,
    defaultValue: 'student'
  }
}, {
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

User.prototype.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Define associations
User.associate = (models) => {
  // A user can be a teacher of many classes
  User.hasMany(models.Class, {
    foreignKey: 'teacherId',
    as: 'teachingClasses'
  });

  // A user can be a student in many classes
  User.belongsToMany(models.Class, {
    through: 'ClassStudents',
    as: 'enrolledClasses',
    foreignKey: 'studentId',
    otherKey: 'classId'
  });

  // A user can create many polls
  User.hasMany(models.Poll, {
    foreignKey: 'teacherId',
    as: 'createdPolls'
  });

  // A user can respond to many polls
  User.hasMany(models.PollResponse, {
    foreignKey: 'studentId',
    as: 'pollResponses'
  });
};

module.exports = User; 