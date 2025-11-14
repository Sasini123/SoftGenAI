const express = require('express');
const auth = require('../middleware/authMiddleware');
const { updateProfile, uploadAvatar, updateStatus } = require('../controller/userController');
const { avatarUpload } = require('../utils/upload');

const router = express.Router();

router.use(auth);

router.put('/me', updateProfile);
router.post('/me/avatar', avatarUpload.single('avatar'), uploadAvatar);
router.patch('/me/status', updateStatus);

module.exports = router;
