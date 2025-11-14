const asyncHandler = require('express-async-handler');
const User = require('../model/User');

const sanitizeUser = (user) => {
  const obj = user.toObject({ getters: true });
  delete obj.password;
  return obj;
};

exports.updateProfile = asyncHandler(async (req, res) => {
  const { displayName, bio, skills } = req.body;
  const user = await User.findById(req.user._id);

  if (displayName !== undefined) user.displayName = displayName;
  if (bio !== undefined) user.bio = bio;
  if (skills !== undefined) {
    user.skills = Array.isArray(skills)
      ? skills
      : skills
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean);
  }

  user.profileCompleted = Boolean(user.displayName) && Boolean(user.bio);
  await user.save();

  res.json({ user: sanitizeUser(user) });
});

exports.uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const user = await User.findById(req.user._id);
  user.avatarUrl = `/uploads/avatars/${req.file.filename}`;
  await user.save();

  res.json({
    message: 'Profile picture updated',
    avatarUrl: user.avatarUrl,
  });
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (status && !['offline', 'online', 'busy'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      status: status || 'online',
      lastActiveAt: Date.now(),
    },
    { new: true }
  );

  res.json({ user: sanitizeUser(user) });
});
