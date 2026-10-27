import { Router } from 'express';
import multer from 'multer';
import { compareDocumentsHandler } from '../controllers/compliance.controller.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
});

export const complianceRouter = Router();

complianceRouter.post(
  '/compare',
  upload.fields([
    { name: 'tdsFile', maxCount: 1 },
    { name: 'ktocFile', maxCount: 1 },
  ]),
  compareDocumentsHandler
);
