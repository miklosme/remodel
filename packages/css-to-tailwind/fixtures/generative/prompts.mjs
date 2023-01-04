import { promises as fs } from 'fs';
import path from 'path';
import { URL } from 'url';
import { makeCSSToTailwindPrompt } from '../../../src/index.mjs';

const __dirname = new URL('.', import.meta.url).pathname;

const data = JSON.parse(
  await fs.readFile(
    path.resolve(__dirname, '../compositions-resolved.json'),
    'utf8',
  ),
);

const results = data.map((result) => {
  return {
    prompt: makeCSSToTailwindPrompt(result.css),
    completion: ` ${result.classList.join(' ')};`,
  };
});

await fs.writeFile(
  path.resolve(__dirname, '../prompts.json'),
  JSON.stringify(results, null, 2),
);
