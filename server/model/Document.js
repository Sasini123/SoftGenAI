const mongoose = require('mongoose');

const documentVersionSchema = new mongoose.Schema(
  {
    content: String,
    language: String,
    savedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    savedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['text', 'code', 'file'],
      default: 'text',
    },
    language: {
      type: String,
      default: 'markdown',
    },
    content: {
      type: String,
      default: '',
    },
    filePath: String,
    fileName: String,
    mimeType: String,
    size: Number,
    versions: {
      type: [documentVersionSchema],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Document', documentSchema);
