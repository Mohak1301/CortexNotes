import 'dotenv/config';
import { OpenAIEmbeddings } from '@langchain/openai';
import { QdrantVectorStore } from '@langchain/qdrant';
import { ensureVectorIndexes } from './vectorIndexes.js';

export const collectionName = process.env.QDRANT_COLLECTION_NAME || 'cortex-notes';

const connection = {
  url: process.env.QDRANT_URL || 'http://localhost:6333',
  collectionName,
  apiKey: process.env.QDRANT_API_KEY,
};

let storePromise = null;

// The collection lookup and index check are two round trips. Do them once.
export const getVectorStore = () => {
  if (!storePromise) {
    storePromise = (async () => {
      const embeddings = new OpenAIEmbeddings({ model: 'text-embedding-3-small' });
      const store = await QdrantVectorStore.fromExistingCollection(embeddings, connection);
      await ensureVectorIndexes(store.client, collectionName);
      return store;
    })().catch((error) => {
      // Drop the failure so the next request retries.
      storePromise = null;
      throw error;
    });
  }
  return storePromise;
};
