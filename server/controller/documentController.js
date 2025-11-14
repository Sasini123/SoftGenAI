const asyncHandler = require('express-async-handler');
const Document = require('../model/Document');
const Project = require('../model/Project');

const isMember = (project, userId) =>
  project.members.some((member) => member.user.toString() === userId.toString());

exports.createDocument = asyncHandler(async (req, res) => {
  const { title, type = 'text', language = 'markdown', content = '' } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  const project = await Project.findById(req.params.projectId);
  if (!project || !isMember(project, req.user._id)) {
    return res.status(404).json({ message: 'Project not found' });
  }

  const document = await Document.create({
    project: project._id,
    title,
    type,
    language,
    content,
    createdBy: req.user._id,
    updatedBy: req.user._id,
    versions: [
      {
        content,
        language,
        savedBy: req.user._id,
      },
    ],
  });

  res.status(201).json({ document });
});

exports.uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const project = await Project.findById(req.params.projectId);
  if (!project || !isMember(project, req.user._id)) {
    return res.status(404).json({ message: 'Project not found' });
  }

  const document = await Document.create({
    project: project._id,
    title: req.file.originalname,
    type: 'file',
    filePath: `/uploads/documents/${req.file.filename}`,
    fileName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  res.status(201).json({ document });
});

exports.getDocuments = asyncHandler(async (req, res) => {
  const project = await Project.findOne({
    _id: req.params.projectId,
    'members.user': req.user._id,
  });

  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  const documents = await Document.find({ project: project._id })
    .sort({ updatedAt: -1 })
    .populate('updatedBy', 'displayName username');

  res.json({ documents });
});

exports.getDocumentById = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.documentId).populate(
    'createdBy updatedBy',
    'displayName username'
  );

  if (!document) {
    return res.status(404).json({ message: 'Document not found' });
  }

  const project = await Project.findOne({
    _id: document.project,
    'members.user': req.user._id,
  });

  if (!project) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  res.json({ document });
});

exports.updateDocument = asyncHandler(async (req, res) => {
  const { content, title, language } = req.body;
  const document = await Document.findById(req.params.documentId);

  if (!document) {
    return res.status(404).json({ message: 'Document not found' });
  }

  const project = await Project.findOne({
    _id: document.project,
    'members.user': req.user._id,
  });

  if (!project) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  if (title !== undefined) document.title = title;
  if (content !== undefined) document.content = content;
  if (language !== undefined) document.language = language;

  document.updatedBy = req.user._id;
  document.versions.push({
    content: content !== undefined ? content : document.content,
    language: language || document.language,
    savedBy: req.user._id,
  });

  await document.save();
  const populated = await Document.findById(document._id).populate(
    'updatedBy',
    'displayName username'
  );

  res.json({ document: populated });
});
