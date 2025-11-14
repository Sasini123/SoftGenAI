const asyncHandler = require('express-async-handler');
const User = require('../model/User');
const generateToken = require('../utils/generateToken');

const sanitizeUser = (user) => {
  const obj = user.toObject({ getters: true });
  delete obj.password;
  return obj;
};

exports.signup = asyncHandler(async (req, res) => {
  const { username, email, password, displayName } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'username, email and password are required' });
  }

  const existing = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
  });

  if (existing) {
    return res.status(409).json({ message: 'User already exists with that email or username' });
  }

  const user = await User.create({
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    password,
    displayName: displayName || username,
  });

  const token = generateToken(user._id);
  return res.status(201).json({ user: sanitizeUser(user), token });
});

exports.login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ message: 'identifier and password are required' });
  }

  const lowered = identifier.toLowerCase();
  const user = await User.findOne({
    $or: [{ email: lowered }, { username: lowered }],
  }).select('+password');

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const passwordMatch = await user.comparePassword(password);
  if (!passwordMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = generateToken(user._id);
  return res.json({ user: sanitizeUser(user), token });
});

exports.getProfile = asyncHandler(async (req, res) => {
  return res.json({ user: sanitizeUser(req.user) });
});
