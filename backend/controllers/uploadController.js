import { pdfloader, textloader, urlloader } from "../helpers.js";
import { cleanFilename, createSourceId, validatePublicUrl, validateText } from '../utils/validation.js';

export const uploadPDF = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded" });
    }
    if (req.file.buffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
      return res.status(415).json({ error: 'The uploaded file is not a valid PDF' });
    }

    const filename = cleanFilename(req.file.originalname);
    const sourceId = createSourceId('pdf');
    const uploadedAt = new Date();
    await pdfloader(req.file.buffer, filename, req.workspaceId, sourceId, {
      sourceName: filename,
      sourceSize: req.file.size,
      sourceUploadedAt: uploadedAt.toISOString(),
    });
    
    // Return source data for frontend to store locally
    const source = {
      id: sourceId,
      name: filename,
      type: 'PDF',
      size: req.file.size,
      originalFilename: filename,
      uploadedAt,
    };
    
    res.json({ 
      message: "PDF uploaded and processed", 
      source: source
    });
  } catch (error) { next(error); }
};

export const uploadText = async (req, res, next) => {
  try {
    const text = validateText(req.body?.text);
    const sourceId = createSourceId('text');
    const uploadedAt = new Date();
    const sourceName = `Text Document ${uploadedAt.toLocaleDateString()}`;
    await textloader(text, req.workspaceId, sourceId, {
      sourceName,
      sourceSize: text.length,
      sourceUploadedAt: uploadedAt.toISOString(),
    });
    
    // Return source data for frontend to store locally
    const source = {
      id: sourceId,
      name: sourceName,
      type: 'TEXT',
      size: text.length,
      uploadedAt,
    };
    
    res.json({ 
      message: "Text received", 
      source: source
    });
  } catch (error) { next(error); }
};

export const uploadLink = async (req, res, next) => {
  try {
    const url = await validatePublicUrl(req.body?.link);
    const sourceId = createSourceId('url');
    const uploadedAt = new Date();
    const sourceName = `Website: ${url.hostname}`;
    await urlloader(url, req.workspaceId, sourceId, {
      sourceName,
      sourceSize: 0,
      sourceUploadedAt: uploadedAt.toISOString(),
    });
    
    // Return source data for frontend to store locally
    const source = {
      id: sourceId,
      name: sourceName,
      type: 'URL',
      size: 0,
      sourceUrl: url.toString(),
      uploadedAt,
    };
    
    res.json({ 
      message: "Link received", 
      source: source
    });
  } catch (error) { next(error); }
};
