import { promises as fs } from 'fs';

// read all JSON files in "../utilities-json" directory
const files = (await fs.readdir('../utilities-json')).filter((file) =>
  file.endsWith('.json'),
);
let data = await Promise.all(
  files.map(async (file) => {
    const content = await fs.readFile(`../utilities-json/${file}`, 'utf8');
    return JSON.parse(content);
  }),
);

data = data.flat();

const noises = new Map();

const getNoiseForSelector = (selector) => {
  if (noises.has(selector)) {
    return noises.get(selector);
  }

  const noise = Math.random()
    .toString(36)
    .substring(2, ((Math.random() * 10) | 0) + 10);

  noises.set(selector, noise);

  return noise;
};

const used = new Set();

const notYetUsed = (item) => {
  const { utility } = item;
  if (used.has(utility)) {
    return false;
  }
  used.add(utility);
  return true;
};

// some utilities coming from a custom Tailwind config,
// but dataset generated in default config
const hasCSS = (item) => {
  const { css } = item;
  return css.length > 0;
};

const processed = data
  .filter(hasCSS)
  .filter(notYetUsed)
  .map((item) => {
    const { utility, css } = item;
    return {
      // TODO use PostCSS to parse CSS and replace selectors
      prompt: css.replace(
        /(\.[a-z0-9-\\\:\/\.]+) {/g,
        (_, selector) => `.${getNoiseForSelector(selector)} {`,
      ),
      completion: ` ${utility};`,
    };
  });

// console.log(JSON.stringify(processed.slice(0, 100), null, 2));
console.log(JSON.stringify(processed, null, 2));
// console.log(processed.length);
