import express from "express";
import multer from "multer";
import { uploadPDF, uploadText, uploadLink } from "../controllers/uploadController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Configure multer for PDF uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 10MB limit
  }
});

// Upload routes - require authentication
router.post("/pdfupload", authMiddleware, upload.single('pdf'), uploadPDF);
router.post("/text", authMiddleware, uploadText);
router.post("/link", authMiddleware, uploadLink);

export default router;
