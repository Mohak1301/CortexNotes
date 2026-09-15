import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// A missing export is not a syntax error, so `node --check` passes and the tests
// pass, and the process only dies at boot - in production. This walks the real
// import graph and confirms every name actually exists, without starting a server.
const IMPORT_PATTERN = /import\s+\{([^}]+)\}\s+from\s+'(\.[^']+)'/g;

const collectFiles = (dir) => fs.readdirSync(dir, { withFileTypes: true })
  .flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return ['node_modules', 'test', 'temp'].includes(entry.name) ? [] : collectFiles(full);
    }
    return entry.name.endsWith('.js') ? [full] : [];
  });

test('every named import in the app resolves to a real export', async () => {
  const files = collectFiles(root);
  const missing = [];

  for (const file of files) {
    // server.js listens on import, so its own body is skipped; its imports are not.
    const source = fs.readFileSync(file, 'utf8');

    for (const match of source.matchAll(IMPORT_PATTERN)) {
      const names = match[1].split(',').map((n) => n.trim().split(/\s+as\s+/)[0]).filter(Boolean);
      const target = path.resolve(path.dirname(file), match[2]);
      if (target.endsWith('server.js')) continue;

      const module = await import(target);
      for (const name of names) {
        if (!(name in module)) {
          missing.push(`${path.relative(root, file)} imports { ${name} } from ${match[2]}, which does not export it`);
        }
      }
    }
  }

  assert.deepEqual(missing, [], missing.join('\n'));
});
