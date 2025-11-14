const express = require('express');
const { signup, login, getProfile } = require('../controller/authController');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', auth, getProfile);

module.exports = router;
