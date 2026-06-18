import { Router } from 'express';
import {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  getDocumentSources,
} from '../controllers/documentController.js';
import upload from '../middleware/upload.js';

const router = Router();

router.get('/sources', getDocumentSources);
router.get('/', getDocuments);
router.get('/:id', getDocumentById);
router.post('/', upload.single('file'), createDocument);
router.put('/:id', upload.single('file'), updateDocument);
router.delete('/:id', deleteDocument);

export default router;
