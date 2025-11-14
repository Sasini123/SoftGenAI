const asyncHandler = require('express-async-handler');
const ChatMessage = require('../model/ChatMessage');
const Project = require('../model/Project');

const ensureMember = async (projectId, userId) => {
  const project = await Project.findOne({
    _id: projectId,
    'members.user': userId,
  });
  return project;
};

exports.listMessages = asyncHandler(async (req, res) => {
  const project = await ensureMember(req.params.projectId, req.user._id);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  const messages = await ChatMessage.find({ project: project._id })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('sender', 'displayName username avatarUrl');

  res.json({ messages: messages.reverse() });
});

exports.sendMessage = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ message: 'Message cannot be empty' });
  }

  const project = await ensureMember(req.params.projectId, req.user._id);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  const chatMessage = await ChatMessage.create({
    project: project._id,
    sender: req.user._id,
    message: message.trim(),
  });

  await chatMessage.populate('sender', 'displayName username avatarUrl');
  res.status(201).json({ message: chatMessage });
});
