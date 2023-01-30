import { promises as fs } from 'fs';
import { URL } from 'url';
import path from 'path';
import { normalize } from '../src/normalize.mjs';

const __dirname = new URL('.', import.meta.url).pathname;

const resolvedUtilities = JSON.parse(
  await fs.readFile(path.resolve(__dirname, 'utilities-resolved.json'), 'utf8'),
);

const results = [];

for (const [utility, css] of Object.entries(resolvedUtilities)) {
  const entries = normalize(css);

  for (const { property, value } of entries) {
    // ['margin-left', '2.5rem', 'ml-10']
    results.push([property, value, utility]);
  }
}

await fs.writeFile(
  path.resolve(__dirname, 'cache.json'),
  JSON.stringify(results, null, 2),
);
