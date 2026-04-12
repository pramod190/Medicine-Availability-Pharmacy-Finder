const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return res.status(401).json({ message: 'Invalid token' });

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token invalid or expired' });
  }
};

const pharmacyAdmin = (req, res, next) => {
  if (req.user.role !== 'pharmacy_admin' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Pharmacy admin access required' });
  }
  next();
};

module.exports = { auth, pharmacyAdmin };
