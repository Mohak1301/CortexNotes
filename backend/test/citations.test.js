import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCitations, toClientSources, toPromptContext } from '../controllers/chatController.js';

const docs = [
  {
    pageContent: 'Vector search returns nearest neighbours.',
    metadata: { sourceId: 'src-1', documentType: 'pdf', originalFilename: 'notes.pdf', loc: { pageNumber: 7 } },
  },
  {
    pageContent: 'x'.repeat(500),
    metadata: { sourceId: 'src-2', documentType: 'url', sourceUrl: 'https://example.com/post' },
  },
  {
    pageContent: 'Pasted text with no title.',
    metadata: { sourceId: 'src-3', documentType: 'text' },
  },
];

test('the number the model is given matches the number the browser renders', () => {
  const citations = buildCitations(docs);
  const prompt = toPromptContext(citations);
  const client = toClientSources(citations);

  // This is the contract the whole feature rests on: a [2] the model writes must
  // resolve to the same document the second chip describes.
  assert.deepEqual(prompt.map((entry) => entry.n), [1, 2, 3]);
  assert.deepEqual(client.map((entry) => entry.n), [1, 2, 3]);
  assert.equal(prompt[0].label, client[0].label);
  assert.equal(prompt[1].label, client[1].label);
});

test('labels fall back from filename to url to a placeholder', () => {
  const [pdf, url, text] = toClientSources(buildCitations(docs));

  assert.equal(pdf.label, 'notes.pdf');
  assert.equal(url.label, 'https://example.com/post');
  assert.equal(text.label, 'Untitled source');
});

test('prompt context drops metadata the model cannot use', () => {
  const [entry] = toPromptContext(buildCitations(docs));

  assert.deepEqual(Object.keys(entry).sort(), ['content', 'label', 'n', 'page']);
  assert.equal(entry.sourceId, undefined);
});

test('client sources carry a bounded snippet, never the whole chunk', () => {
  const [, long] = toClientSources(buildCitations(docs));

  assert.ok(long.snippet.length < 500, 'snippet must be trimmed');
  assert.ok(long.snippet.endsWith('…'), 'trimmed snippet should be marked as cut');
  assert.equal(long.content, undefined, 'full chunk text must not reach the browser');
});

test('page number is absent for sources that have no pages', () => {
  const [pdf, url] = toClientSources(buildCitations(docs));

  assert.equal(pdf.page, 7);
  assert.equal(url.page, undefined);
});
