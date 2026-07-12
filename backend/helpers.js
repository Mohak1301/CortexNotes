import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from '@langchain/core/documents';
import { load as loadHtml } from 'cheerio';

import path from 'path';
import fs from 'fs';
import os from 'os';
import { config } from './config.js';
import { validatePublicUrl } from './utils/validation.js';
import { ensureVectorIndexes } from './services/vectorIndexes.js';

const vectorConfig = {
  url: process.env.QDRANT_URL || 'http://localhost:6333',
  collectionName: process.env.QDRANT_COLLECTION_NAME || 'cortex-notes',
  apiKey: process.env.QDRANT_API_KEY,
};

const attachMetadata = (docs, metadata) => docs.map((doc) => {
  doc.metadata = { ...doc.metadata, ...metadata, uploadedAt: new Date().toISOString() };
  return doc;
});

const readWithTimeout = async (reader) => {
  let timeout;
  try {
    return await Promise.race([
      reader.read(),
      new Promise((_, reject) => {
        timeout = setTimeout(
          () => {
            void reader.cancel();
            reject(Object.assign(new Error('The website took too long to respond'), { status: 408 }));
          },
          config.requestTimeoutMs,
        );
      }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
};

export const pdfloader = async (pdfBuffer, originalFilename, userId, sourceId, sourceMetadata = {}) => {
  let tempFilePath = null;
  
  try {
    const tempDir = os.tmpdir();
    
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2)}`;
    tempFilePath = path.join(tempDir, `pdf_${uniqueSuffix}_${originalFilename}`);
    
    fs.writeFileSync(tempFilePath, pdfBuffer);
    
    const loader = new PDFLoader(tempFilePath);

    const docs = await loader.load();

    const extractedCharacters = docs.reduce((sum, doc) => sum + doc.pageContent.length, 0);
    if (docs.length > 500 || extractedCharacters > config.maxExtractedChars) {
      throw Object.assign(new Error('The PDF contains too much content to process safely'), { status: 413 });
    }

    attachMetadata(docs, { userId, sourceId, documentType: 'pdf', originalFilename, ...sourceMetadata });

      const embeddings = new OpenAIEmbeddings({
    model: 'text-embedding-3-small',
  });

    const vectorStore = await QdrantVectorStore.fromDocuments(docs, embeddings, {
      ...vectorConfig,
    });
    await ensureVectorIndexes(vectorStore.client, vectorConfig.collectionName);
    console.log('Vector store created successfully for PDF');

    console.log(`PDF processed and ${docs.length} chunks added to vector database`);
    
  } catch (error) {
    console.error("PDF processing error:", error);
    throw error;
  } finally {
    // Clean up temporary file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);

      } catch (cleanupError) {
        console.warn('Failed to clean up temporary file:', cleanupError.message);
      }
    }
  }
}


export const textloader = async (text, userId, sourceId, sourceMetadata = {}) => {
    try{
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
    separators: ["\n\n", "\n", " "], // optional, defaults similar to this
  });
  const docs = await splitter.createDocuments([text]);

  attachMetadata(docs, { userId, sourceId, documentType: 'text', ...sourceMetadata });

  const embeddings = new OpenAIEmbeddings({
    model: 'text-embedding-3-small',
  });

    const vectorStore = await QdrantVectorStore.fromDocuments(docs, embeddings, {
      ...vectorConfig,
    });
    await ensureVectorIndexes(vectorStore.client, vectorConfig.collectionName);

  console.log(`Text processed and ${docs.length} chunks added to vector database`);

}
catch(error){
  console.error("Text processing error:", error);
  throw error;
}


}

export const urlloader = async (inputUrl, userId, sourceId, sourceMetadata = {}) => {
      let url = await validatePublicUrl(inputUrl.toString());
      let response;

      for (let redirects = 0; redirects <= 4; redirects += 1) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);
        try {
          response = await fetch(url, {
            redirect: 'manual',
            signal: controller.signal,
            headers: { 'User-Agent': 'CortexNotes/1.0 document importer' },
          });
        } finally {
          clearTimeout(timeout);
        }

        if (![301, 302, 303, 307, 308].includes(response.status)) break;
        const location = response.headers.get('location');
        if (!location || redirects === 4) {
          throw Object.assign(new Error('The website redirected too many times'), { status: 400 });
        }
        url = await validatePublicUrl(new URL(location, url).toString());
      }

      if (!response?.ok) {
        throw Object.assign(new Error('The website could not be imported'), { status: 400 });
      }
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
        throw Object.assign(new Error('The URL does not point to a supported web page'), { status: 415 });
      }
      const declaredSize = Number(response.headers.get('content-length') || 0);
      if (declaredSize > config.maxWebBytes) {
        throw Object.assign(new Error('The website content is too large to import'), { status: 413 });
      }

      const reader = response.body.getReader();
      const chunks = [];
      let received = 0;
      while (true) {
        const { done, value } = await readWithTimeout(reader);
        if (done) break;
        received += value.byteLength;
        if (received > config.maxWebBytes) {
          await reader.cancel();
          throw Object.assign(new Error('The website content is too large to import'), { status: 413 });
        }
        chunks.push(value);
      }

      const html = new TextDecoder().decode(Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))));
      const $ = loadHtml(html);
      $('script, style, noscript, svg').remove();
      const pageContent = $('body').text().replace(/\s+/g, ' ').trim();
      if (!pageContent) {
        throw Object.assign(new Error('No readable text was found on this page'), { status: 400 });
      }
      if (pageContent.length > config.maxExtractedChars) {
        throw Object.assign(new Error('The website contains too much text to process safely'), { status: 413 });
      }
      const webSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 160,
      });
      const docs = await webSplitter.splitDocuments([
        new Document({ pageContent, metadata: { source: url.toString() } }),
      ]);
      const link = url.toString();

      // Add user ID metadata to each document
      attachMetadata(docs, { userId, sourceId, documentType: 'url', sourceUrl: link, ...sourceMetadata });



      const embeddings = new OpenAIEmbeddings({
        model: 'text-embedding-3-small',
      });

        const vectorStore = await QdrantVectorStore.fromDocuments(docs, embeddings, {
          ...vectorConfig,
        });
      await ensureVectorIndexes(vectorStore.client, vectorConfig.collectionName);

      console.log(`URL processed and ${docs.length} chunks added to vector database`);

}
