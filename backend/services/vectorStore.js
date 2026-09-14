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

// Looking up the collection and checking the payload indexes each cost a Qdrant
// round trip. Both are process-wide facts, so pay for them once rather than on
// every request.
export const getVectorStore = () => {
  if (!storePromise) {
    storePromise = (async () => {
      const embeddings = new OpenAIEmbeddings({ model: 'text-embedding-3-small' });
      const store = await QdrantVectorStore.fromExistingCollection(embeddings, connection);
      await ensureVectorIndexes(store.client, collectionName);
      return store;
    })().catch((error) => {
      // Drop the cached rejection so the next request can retry.
      storePromise = null;
      throw error;
    });
  }
  return storePromise;
};
