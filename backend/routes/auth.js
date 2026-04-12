const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');
const { auth } = require('../middleware/auth');

const sign = (id) => jwt.sign({ userId: id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '7d' });

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already in use' });
    const user = await User.create({ name, email, password, role: role || 'user', phone });
    res.status(201).json({ token: sign(user._id), user: { id: user._id, name, email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(400).json({ message: 'Invalid credentials' });
    res.json({ token: sign(user._id), user: { id: user._id, name: user.name, email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get profile
router.get('/profile', auth, async (req, res) => {
  res.json(req.user);
});

// Update reminders
router.put('/reminders', auth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { reminders: req.body.reminders },
      { new: true }
    );
    res.json(user.reminders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
