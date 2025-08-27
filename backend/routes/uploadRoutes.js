import express from "express";
import multer from "multer";
import { uploadPDF, uploadText, uploadLink } from "../controllers/uploadController.js";

const router = express.Router();

// Configure multer for PDF uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 10MB limit
  }
});

// Upload routes - no authentication required
router.post("/pdfupload", upload.single('pdf'), uploadPDF);
router.post("/text", uploadText);
router.post("/link", uploadLink);

export default router;
