import { makeCSSToTailwindPrompt } from '../src/index.mjs';
import parseCSS from 'postcss-safe-parser';
import { promises as fs } from 'fs';
import path from 'path';
import { URL } from 'url';

const __dirname = new URL('.', import.meta.url).pathname;

function choose(choices) {
  const index = Math.floor(Math.random() * choices.length);
  return choices[index];
}

const compositionresolved = JSON.parse(
  await fs.readFile(
    path.resolve(
      __dirname,
      '../fixtures/generative/compositions-resolved.json',
    ),
    'utf8',
  ),
);

function makeExample(resolved) {
  return Object.entries(resolved).flatMap(([utility, css]) => {
    const results = [];
    const ast = parseCSS(css);
    ast.walkDecls((decl) => {
      results.push([`${decl.prop}: ${decl.value}`, utility]);
    });
    if (results.length === 0) {
      throw new Error('No declarations in utility');
    }
    return results;
  });
}

function makePrompt() {
  const example = makeExample(choose(compositionresolved).resolved);
  return `
Rewrite the following CSS declarations to Tailwind CSS classes.

CSS:
${example
  .map(([declaration], index) => `${index + 1}. ${declaration};`)
  .join('\n')}
TW:
${example
  .map(([declaration, utility], index) => `${index + 1}. ${utility};`)
  .join('\n')}
`;
}

console.log(makePrompt());
