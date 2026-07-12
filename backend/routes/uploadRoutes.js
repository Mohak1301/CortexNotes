import express from "express";
import multer from "multer";
import { uploadPDF, uploadText, uploadLink } from "../controllers/uploadController.js";
import { config } from '../config.js';
import { rateLimit } from '../middleware/security.js';

const router = express.Router();

// Configure multer for PDF uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxPdfBytes,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (file.mimetype !== 'application/pdf') {
      return callback(Object.assign(new Error('Only PDF files are supported'), { status: 415 }));
    }
    callback(null, true);
  },
});

const expensiveLimit = rateLimit({ limit: config.expensiveRateLimit, name: 'ingestion' });
router.post("/pdfupload", expensiveLimit, upload.single('pdf'), uploadPDF);
router.post("/text", expensiveLimit, uploadText);
router.post("/link", expensiveLimit, uploadLink);

export default router;
