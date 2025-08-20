import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";

import path from 'path';
import fs from 'fs';
import os from 'os';

export const pdfloader = async (pdfBuffer, originalFilename, userId) => {
  let tempFilePath = null;
  
  try {
    const tempDir = os.tmpdir();
    
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2)}`;
    tempFilePath = path.join(tempDir, `pdf_${uniqueSuffix}_${originalFilename}`);
    
    fs.writeFileSync(tempFilePath, pdfBuffer);
    
    const loader = new PDFLoader(tempFilePath);

    const docs = await loader.load();

    // Add user ID metadata to each document
    docs.forEach(doc => {
      doc.metadata = {
        ...doc.metadata,
        userId: userId,
        documentType: 'pdf',
        originalFilename: originalFilename,
        uploadedAt: new Date().toISOString()
      };
    });

    const embeddings = new OpenAIEmbeddings({
      model: 'text-embedding-3-small',
    });

    const vectorStore = await QdrantVectorStore.fromDocuments(docs, embeddings, {
      url: process.env.QDRANT_URL || 'http://localhost:6333',
      collectionName: 'chaicode-collection',
    });

    console.log('Indexing of documents done...');
    
  } catch (error) {
    console.error("PDF processing error:", error);
    throw error;
  } finally {
    // Clean up temporary file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
        console.log('Temporary file cleaned up');
      } catch (cleanupError) {
        console.warn('Failed to clean up temporary file:', cleanupError.message);
      }
    }
  }
}


export const textloader = async (text, userId) => {
    try{
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
    separators: ["\n\n", "\n", " "], // optional, defaults similar to this
  });
  const docs = await splitter.createDocuments([text]);

  // Add user ID metadata to each document
  docs.forEach(doc => {
    doc.metadata = {
      ...doc.metadata,
      userId: userId,
      documentType: 'text',
      uploadedAt: new Date().toISOString()
    };
  });

  const embeddings = new OpenAIEmbeddings({
    model: 'text-embedding-3-small',
  });

  const vectorStore = await QdrantVectorStore.fromDocuments(docs, embeddings, {
    url: process.env.QDRANT_URL || 'http://localhost:6333',
    collectionName: 'chaicode-collection',
  });
  console.log('Indexing of documents done...');
}
catch(error){
  console.error("Text processing error:", error);
  throw error;
}


}

export const urlloader = async (link, userId) => {
    const loader = new CheerioWebBaseLoader(
        link
      );
      const docs = await loader.load();

      // Add user ID metadata to each document
      docs.forEach(doc => {
        doc.metadata = {
          ...doc.metadata,
          userId: userId,
          documentType: 'url',
          sourceUrl: link,
          uploadedAt: new Date().toISOString()
        };
      });

      console.log(docs)

      const embeddings = new OpenAIEmbeddings({
        model: 'text-embedding-3-small',
      });

      const vectorStore = await QdrantVectorStore.fromDocuments(docs, embeddings, {
        url: process.env.QDRANT_URL || 'http://localhost:6333',
        collectionName: 'chaicode-collection',
      }
      )
  console.log('Indexing of documents done...')

}