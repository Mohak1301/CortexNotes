import test from 'node:test';
import assert from 'node:assert/strict';
import { ensureVectorIndexes } from '../services/vectorIndexes.js';

test('required authenticated workspace payload indexes are provisioned', async () => {
  const calls = [];
  const client = {
    async createPayloadIndex(collection, options) { calls.push({ collection, options }); },
  };
  await ensureVectorIndexes(client, 'test-index-collection');
  assert.deepEqual(calls, [
    {
      collection: 'test-index-collection',
      options: { field_name: 'metadata.userId', field_schema: 'keyword', wait: true },
    },
    {
      collection: 'test-index-collection',
      options: { field_name: 'metadata.sourceId', field_schema: 'keyword', wait: true },
    },
  ]);
});
