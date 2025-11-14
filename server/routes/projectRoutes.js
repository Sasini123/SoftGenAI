const express = require('express');
const auth = require('../middleware/authMiddleware');
const {
  createProject,
  getProjects,
  getProjectDetail,
  addMember,
  updatePresence,
  getPresence,
} = require('../controller/projectController');
const {
  createDocument,
  uploadDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
} = require('../controller/documentController');
const { listMessages, sendMessage } = require('../controller/chatController');
const { documentUpload } = require('../utils/upload');

const router = express.Router();

router.use(auth);

// Document detail routes must be defined before :projectId wildcard
router.get('/documents/:documentId', getDocumentById);
router.put('/documents/:documentId', updateDocument);

router.route('/')
  .get(getProjects)
  .post(createProject);

router.get('/:projectId', getProjectDetail);
router.post('/:projectId/members', addMember);
router.get('/:projectId/presence', getPresence);
router.post('/:projectId/presence', updatePresence);

router
  .route('/:projectId/documents')
  .get(getDocuments)
  .post(createDocument);

router.post(
  '/:projectId/documents/upload',
  documentUpload.single('file'),
  uploadDocument
);

router
  .route('/:projectId/chat')
  .get(listMessages)
  .post(sendMessage);

module.exports = router;
