const asyncHandler = require('express-async-handler');
const Project = require('../model/Project');
const User = require('../model/User');
const Document = require('../model/Document');
const ChatMessage = require('../model/ChatMessage');

const withMembers = [
  { path: 'members.user', select: 'username displayName avatarUrl status lastActiveAt' },
];

const toId = (value) => {
  if (!value) return value;
  if (typeof value === 'object' && value._id) return value._id;
  return value;
};

const ensureMember = (project, userId) =>
  project.members.some((member) => toId(member.user).toString() === userId.toString());

const ensureHead = (project, userId) =>
  project.members.some(
    (member) =>
      toId(member.user).toString() === userId.toString() && member.role === 'head'
  );

exports.createProject = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Project name is required' });
  }

  const project = await Project.create({
    name,
    description,
    createdBy: req.user._id,
    members: [
      {
        user: req.user._id,
        role: 'head',
        presence: 'offline',
      },
    ],
  });

  const populated = await Project.findById(project._id).populate(withMembers);
  res.status(201).json({ project: populated });
});

exports.getProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({ 'members.user': req.user._id })
    .populate(withMembers)
    .sort({ updatedAt: -1 });

  res.json({ projects });
});

exports.getProjectDetail = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.projectId)
    .populate(withMembers)
    .lean();

  if (!project || !ensureMember(project, req.user._id)) {
    return res.status(404).json({ message: 'Project not found' });
  }

  const documents = await Document.find({ project: project._id })
    .select('title type language updatedAt updatedBy')
    .populate('updatedBy', 'displayName username');

  const recentMessages = await ChatMessage.find({ project: project._id })
    .sort({ createdAt: -1 })
    .limit(30)
    .populate('sender', 'displayName username avatarUrl');

  res.json({ project, documents, chat: recentMessages.reverse() });
});

exports.addMember = asyncHandler(async (req, res) => {
  const { emailOrUsername } = req.body;
  if (!emailOrUsername) {
    return res.status(400).json({ message: 'Email or username is required' });
  }

  const project = await Project.findById(req.params.projectId).populate(withMembers);

  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  if (!ensureHead(project, req.user._id)) {
    return res.status(403).json({ message: 'Only the project head can add members' });
  }

  const lowered = emailOrUsername.toLowerCase();
  const user = await User.findOne({
    $or: [{ email: lowered }, { username: lowered }],
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (ensureMember(project, user._id)) {
    return res.status(409).json({ message: 'User already in project' });
  }

  project.members.push({ user: user._id, role: 'collaborator' });
  await project.save();
  await project.populate(withMembers);

  res.json({ project });
});

exports.updatePresence = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ['offline', 'viewing', 'editing'];
  if (status && !allowed.includes(status)) {
    return res.status(400).json({ message: 'Invalid presence status' });
  }

  const project = await Project.findOne({
    _id: req.params.projectId,
    'members.user': req.user._id,
  });

  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  project.members = project.members.map((member) => {
    if (toId(member.user).toString() === req.user._id.toString()) {
      member.presence = status || 'viewing';
      member.lastActiveAt = new Date();
    }
    return member;
  });

  await project.save();
  const populated = await Project.findById(project._id).populate(withMembers);

  res.json({ members: populated.members });
});

exports.getPresence = asyncHandler(async (req, res) => {
  const project = await Project.findOne({
    _id: req.params.projectId,
    'members.user': req.user._id,
  }).populate(withMembers);

  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  res.json({ members: project.members });
});
