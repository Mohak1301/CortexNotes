import { pdfloader, textloader, urlloader } from "../helpers.js";
import Source from "../models/Source.js";

export const uploadPDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded" });
    }

    await pdfloader(req.file.buffer, req.file.originalname, req.user._id.toString());
    
    // Save source to database
    const source = new Source({
      userId: req.user._id,
      name: req.file.originalname,
      type: 'PDF',
      size: req.file.size,
      originalFilename: req.file.originalname
    });
    await source.save();
    
    res.json({ 
      message: "PDF uploaded and processed", 
      source: {
        id: source._id,
        name: source.name,
        type: source.type,
        size: source.size,
        uploadedAt: source.uploadedAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const uploadText = async (req, res) => {
  try {
    const { text } = req.body;
    await textloader(text, req.user._id.toString());
    
    // Save source to database
    const source = new Source({
      userId: req.user._id,
      name: `Text Document ${new Date().toLocaleDateString()}`,
      type: 'TEXT',
      size: text.length
    });
    await source.save();

    res.json({ 
      message: "Text received", 
      source: {
        id: source._id,
        name: source.name,
        type: source.type,
        size: source.size,
        uploadedAt: source.uploadedAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const uploadLink = async (req, res) => {
  try {
    const { link } = req.body;
    await urlloader(link, req.user._id.toString());
    
    // Save source to database
    const source = new Source({
      userId: req.user._id,
      name: `Website: ${new URL(link).hostname}`,
      type: 'URL',
      size: 0,
      sourceUrl: link
    });
    await source.save();

    res.json({ 
      message: "Link received", 
      source: {
        id: source._id,
        name: source.name,
        type: source.type,
        size: source.size,
        uploadedAt: source.uploadedAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
