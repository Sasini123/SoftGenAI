const mongoose = require('mongoose');

const projectMemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['head', 'collaborator'],
      default: 'collaborator',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    presence: {
      type: String,
      enum: ['offline', 'viewing', 'editing'],
      default: 'offline',
    },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: {
      type: [projectMemberSchema],
      default: [],
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
    activeDocument: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
    },
  },
  {
    timestamps: true,
  }
);

projectSchema.index({ 'members.user': 1 });

module.exports = mongoose.model('Project', projectSchema);
