import path from 'path';
import { promises as fs } from 'fs';
import { URL } from 'url';

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

const content = reader.flat();

function choose(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const findDirectOnly = (c) => {
  if (Object.values(c.appliesRulesDirectly).every(Boolean) === false)
    return false;

  return true;
};

const findBasic = (c) => {
  if (c.classList.length > 3) return false;
  if (Object.keys(c.style).length > 1) return false;
  if (/[\]\)\:]/.test(c.classList.join(' '))) return false;

  return true;
};

const findAdvanced = (c) => {
  if (c.classList.length < 4) return false;
  if (Object.keys(c.style).length !== 2) return false;

  return true;
};

const findComplex = (c) => {
  if (c.classList.length < 8) return false;
  if (Object.keys(c.style).length < 3) return false;

  return true;
};

// const FIND_FN = findBasic;
// const FIND_FN = findAdvanced;
const FIND_FN = findComplex;

const filtered = content.filter(findDirectOnly).filter(FIND_FN);

Array(5)
  .fill()
  .forEach((_, index) => {
    const c = choose(filtered);
    console.log(index + 1, c.classList.join(' '));
  });
