import path from 'path';
import { promises as fs } from 'fs';
import { URL } from 'url';

if (!process.env.IDS) {
  throw new Error('Missing env.IDS');
}

const __dirname = new URL('.', import.meta.url).pathname;

const files = [
  '../compositions-resolved-direct-only/keynote.compositions-direct-only.json',
  '../compositions-resolved-direct-only/pocket.compositions-direct-only.json',
  '../compositions-resolved-direct-only/primer.compositions-direct-only.json',
  '../compositions-resolved-direct-only/salient.compositions-direct-only.json',
  '../compositions-resolved-direct-only/spotlight.compositions-direct-only.json',
  '../compositions-resolved-direct-only/syntax.compositions-direct-only.json',
  '../compositions-resolved-direct-only/transmit.compositions-direct-only.json',
];

const reader = await Promise.all(
  files.map(async (file) => {
    const content = await fs.readFile(path.join(__dirname, file), 'utf8');
    return JSON.parse(content);
  }),
);

const ids = new Set(process.env.IDS.split(','));
const compositions = reader.flat().filter((c) => ids.has(c.id));

if (!compositions) {
  console.log('Compositions not found');
  process.exit();
}

console.log(JSON.stringify(compositions, null, 2));
