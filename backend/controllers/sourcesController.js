import { OpenAIEmbeddings } from '@langchain/openai';
import { QdrantVectorStore } from '@langchain/qdrant';
import { ensureVectorIndexes } from '../services/vectorIndexes.js';

const getClient = async () => {
  const vectorStore = await QdrantVectorStore.fromExistingCollection(
    new OpenAIEmbeddings({ model: 'text-embedding-3-small' }),
    {
      url: process.env.QDRANT_URL || 'http://localhost:6333',
      collectionName: process.env.QDRANT_COLLECTION_NAME || 'cortex-notes',
      apiKey: process.env.QDRANT_API_KEY,
    },
  );
  const collectionName = process.env.QDRANT_COLLECTION_NAME || 'cortex-notes';
  await ensureVectorIndexes(vectorStore.client, collectionName);
  return {
    client: vectorStore.client,
    collectionName,
  };
};

const workspaceCondition = (workspaceId) => ({
  key: 'metadata.userId',
  match: { value: workspaceId },
});

export const listSources = async (req, res, next) => {
  try {
    const { client, collectionName } = await getClient();
    const result = await client.scroll(collectionName, {
      limit: 10_000,
      with_payload: true,
      with_vector: false,
      filter: { must: [workspaceCondition(req.workspaceId)] },
    });
    const sources = new Map();
    for (const point of result.points || []) {
      const metadata = point.payload?.metadata || {};
      if (!metadata.sourceId || sources.has(metadata.sourceId)) continue;
      const type = String(metadata.documentType || '').toUpperCase();
      sources.set(metadata.sourceId, {
        id: metadata.sourceId,
        name: metadata.sourceName || metadata.originalFilename || metadata.sourceUrl || 'Untitled source',
        type: type === 'PDF' ? 'PDF' : type === 'URL' ? 'URL' : 'TEXT',
        size: Number(metadata.sourceSize) || 0,
        uploadedAt: metadata.sourceUploadedAt || metadata.uploadedAt,
        ...(metadata.sourceUrl ? { sourceUrl: metadata.sourceUrl } : {}),
      });
    }
    res.json({ sources: [...sources.values()].sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)) });
  } catch (error) { next(error); }
};

export const deleteSource = async (req, res, next) => {
  try {
    const { sourceId } = req.params;
    if (!/^(pdf|text|url)_[0-9a-f-]{36}$/i.test(sourceId || '')) {
      return res.status(400).json({ error: 'Invalid source identifier' });
    }

    const { client, collectionName } = await getClient();
    await client.delete(collectionName, {
      wait: true,
      filter: {
        must: [
          workspaceCondition(req.workspaceId),
          { key: 'metadata.sourceId', match: { value: sourceId } },
        ],
      },
    });

    res.json({ message: 'Source deleted', sourceId });
  } catch (error) {
    next(error);
  }
};

export const clearAllSources = async (req, res, next) => {
  try {
    const { client, collectionName } = await getClient();
    await client.delete(collectionName, {
      wait: true,
      filter: { must: [workspaceCondition(req.workspaceId)] },
    });
    res.json({ message: 'Workspace sources cleared' });
  } catch (error) {
    next(error);
  }
};
