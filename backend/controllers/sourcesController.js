import Source from '../models/Source.js';

// Get user sources from database
export const getUserSources = async (req, res) => {
  try {
    const sources = await Source.find({ userId: req.user._id })
      .sort({ uploadedAt: -1 })
      .select('-__v');
    
    res.json({ sources });
  } catch (error) {
    console.error('Error fetching sources:', error);
    res.status(500).json({ error: 'Failed to fetch sources' });
  }
};


export const getAllDocuments = async (req, res) => {
  try {
    
    const embeddings = new OpenAIEmbeddings({
      model: 'text-embedding-3-small',
    });

    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        url: 'http://localhost:6333',
        collectionName: 'chaicode-collection',
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
