const requiredIndexes = [
  { field_name: 'metadata.userId', field_schema: 'keyword' },
  { field_name: 'metadata.sourceId', field_schema: 'keyword' },
];

const readiness = new Map();

export const ensureVectorIndexes = async (client, collectionName) => {
  if (readiness.has(collectionName)) return readiness.get(collectionName);

  const promise = Promise.all(requiredIndexes.map((index) => client.createPayloadIndex(
    collectionName,
    { ...index, wait: true },
  ))).catch((cause) => {
    readiness.delete(collectionName);
    const error = Object.assign(
      new Error('Vector database indexes could not be prepared'),
      { status: 503, cause },
    );
    throw error;
  });

  readiness.set(collectionName, promise);
  await promise;
};
