import { promises as fs } from 'fs';
import { URL } from 'url';
import path from 'path';

const __dirname = new URL('.', import.meta.url).pathname;

const data = JSON.parse(
  await fs.readFile(
    path.resolve(__dirname, '../compositions-resolved.json'),
    'utf8',
  ),
);

// implement any filtering you want here
const result = data.filter((item) => {
  return true;
});

await fs.writeFile(
  path.resolve(__dirname, '../compositions-filtered.json'),
  JSON.stringify(result, null, 2),
);
