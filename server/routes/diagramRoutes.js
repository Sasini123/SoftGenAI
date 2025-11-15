const express = require('express');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Diagram = require('../model/Diagram');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

const generateSlug = () => Math.random().toString(36).substring(2, 8);

const createUniqueSlug = async () => {
  let slug = generateSlug();
  let attempts = 0;
  // Avoid infinite loops if collisions happen frequently.
  while (attempts < 5) {
    const exists = await Diagram.exists({ slug });
    if (!exists) return slug;
    slug = generateSlug();
    attempts += 1;
  }
  // Fallback to a timestamp-based slug if random generation keeps colliding.
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 4)}`;
};

router.post('/', auth, asyncHandler(async (req, res) => {
  const { source } = req.body || {};
  if (!source || typeof source !== 'string') {
    return res.status(400).json({ message: 'Diagram source is required' });
  }
  const diagram = await Diagram.create({
    source,
    createdBy: req.user._id,
    slug: await createUniqueSlug(),
  });
  return res.status(201).json({ id: diagram._id, code: diagram.slug });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  let diagram = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    diagram = await Diagram.findById(id);
  }
  if (!diagram) {
    diagram = await Diagram.findOne({ slug: id });
  }
  if (!diagram) {
    return res.status(404).json({ message: 'Diagram not found' });
  }
  return res.json(diagram);
}));

module.exports = router;
