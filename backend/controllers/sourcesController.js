import { OpenAIEmbeddings } from '@langchain/openai';
import { QdrantVectorStore } from '@langchain/qdrant';

// Delete a source's embeddings from vector DB
export const deleteSource = async (req, res) => {
  try {
    const { sourceId } = req.params;
    
    // For frontend-managed sources, we'll clear all vectors since we don't track individual source vectors
    // This is a simplified approach - in production you might want to track vector IDs per source
    try {
      const embeddings = new OpenAIEmbeddings({
        model: 'text-embedding-3-small',
      });

      const vectorStore = await QdrantVectorStore.fromExistingCollection(
        embeddings,
        {
          url: process.env.QDRANT_URL || 'http://localhost:6333',
          collectionName: 'chaicode-collection',
          apiKey: process.env.QDRANT_API_KEY, // For Qdrant Cloud
        }
      );

      const client = vectorStore.client;
      
      // Get all points and delete them (since we don't track individual source vectors)
      const points = await client.scroll('chaicode-collection', {
        limit: 10000,
        with_payload: false,
        with_vector: false
      });
      
      if (points.points && points.points.length > 0) {
        const pointIds = points.points.map(point => point.id);
        await client.delete('chaicode-collection', {
          wait: true,
          points: pointIds
        });
        console.log(`Deleted ${pointIds.length} vectors for source ${sourceId}`);
      }
    } catch (vectorError) {
      console.error('Error deleting vectors:', vectorError);
      // Continue even if vector deletion fails
    }
    
    res.json({ 
      message: 'Source embeddings deleted successfully',
      sourceId: sourceId
    });
  } catch (error) {
    console.error('Error deleting source:', error);
    res.status(500).json({ error: 'Failed to delete source' });
  }
};

// Clear all embeddings from vector DB
export const clearAllSources = async (req, res) => {
  try {
    // Handle both regular DELETE requests and sendBeacon requests
    const isSendBeacon = req.method === 'POST' || req.headers['content-type'] === 'application/json';
    
    // Delete all embeddings from Qdrant Cloud
    try {
      const embeddings = new OpenAIEmbeddings({
        model: 'text-embedding-3-small',
      });

      const vectorStore = await QdrantVectorStore.fromExistingCollection(
        embeddings,
        {
          url: process.env.QDRANT_URL || 'http://localhost:6333',
          collectionName: 'chaicode-collection',
          apiKey: process.env.QDRANT_API_KEY, // For Qdrant Cloud
        }
      );

      const client = vectorStore.client;
      
      // Get all points and delete them
      const points = await client.scroll('chaicode-collection', {
        limit: 10000,
        with_payload: false,
        with_vector: false
      });
      
      if (points.points && points.points.length > 0) {
        const pointIds = points.points.map(point => point.id);
        await client.delete('chaicode-collection', {
          wait: true,
          points: pointIds
        });
        console.log(`Deleted ${pointIds.length} vectors from collection`);
      }
    } catch (vectorError) {
      console.error('Error clearing vectors:', vectorError);
    }
    
    // For sendBeacon requests, don't send a response
    if (isSendBeacon) {
      res.status(200).end();
    } else {
      res.json({ 
        message: 'All embeddings cleared successfully',
        deletedCount: 0 // We don't track count in backend anymore
      });
    }
  } catch (error) {
    console.error('Error clearing sources:', error);
    if (!req.headers['content-type']?.includes('application/json')) {
      res.status(200).end(); // For sendBeacon, always return 200
    } else {
      res.status(500).json({ error: 'Failed to clear sources' });
    }
  }
};

// Get all documents from vector DB (for testing)
export const getAllDocuments = async (req, res) => {
  try {
    
    const embeddings = new OpenAIEmbeddings({
      model: 'text-embedding-3-small',
    });

    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        url: process.env.QDRANT_URL || 'http://localhost:6333',
        collectionName: 'chaicode-collection',
        apiKey: process.env.QDRANT_API_KEY, // For Qdrant Cloud
      }
    );

    const client = vectorStore.client;
    const collectionName = vectorStore.collectionName;
    
    const points = await client.scroll(collectionName, {
      limit: 1000,
      with_payload: true,
      with_vector: false
    });

    const allDocs = points.points?.map(point => ({
      id: point.id,
      payload: point.payload
    })) || [];

    res.json({ 
      totalDocuments: allDocs.length,
      documents: allDocs 
    });
  } catch (error) {
    console.error('Error testing vector database:', error);
    res.status(500).json({ error: 'Failed to test vector database' });
  }
};
