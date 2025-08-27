import { pdfloader, textloader, urlloader } from "../helpers.js";

export const uploadPDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded" });
    }

    await pdfloader(req.file.buffer, req.file.originalname, 'demo-user');
    
    // Return source data for frontend to store locally
    const source = {
      id: Date.now(),
      name: req.file.originalname,
      type: 'PDF',
      size: req.file.size,
      originalFilename: req.file.originalname,
      uploadedAt: new Date()
    };
    
    res.json({ 
      message: "PDF uploaded and processed", 
      source: source
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const uploadText = async (req, res) => {
  try {
    const { text } = req.body;
    await textloader(text, 'demo-user');
    
    // Return source data for frontend to store locally
    const source = {
      id: Date.now(),
      name: `Text Document ${new Date().toLocaleDateString()}`,
      type: 'TEXT',
      size: text.length,
      uploadedAt: new Date()
    };
    
    res.json({ 
      message: "Text received", 
      source: source
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const uploadLink = async (req, res) => {
  try {
    const { link } = req.body;
    await urlloader(link, 'demo-user');
    
    // Return source data for frontend to store locally
    const source = {
      id: Date.now(),
      name: `Website: ${new URL(link).hostname}`,
      type: 'URL',
      size: 0,
      sourceUrl: link,
      uploadedAt: new Date()
    };
    
    res.json({ 
      message: "Link received", 
      source: source
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
