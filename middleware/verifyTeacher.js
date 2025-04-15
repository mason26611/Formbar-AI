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

module.exports = { verifyTeacher }; 