import { promises as fs } from 'fs';
import postcss from 'postcss';
import parseCSS from 'postcss-safe-parser';
import parseSelector from 'postcss-selector-parser';

const files = (await fs.readdir('../utilities-json')).filter((file) =>
  file.endsWith('.json'),
);
let data = await Promise.all(
  files.map(async (file) => {
    const content = await fs.readFile(`../utilities-json/${file}`, 'utf8');
    return JSON.parse(content);
  }),
);

const noises = new Map();

async function noiseSelectors(css) {
  const noising = {
    postcssPlugin: 'noise-selectors',
    Once(root) {
      root.walkRules((rule) => {
        const noise = () =>
          (
            Math.random().toString(36).substring(2, 10) +
            Math.random().toString(36).substring(2, 10)
          ).substring(0, ((Math.random() * 10) | 0) + 8);

        parseSelector((selectors) => {
          selectors.walkClasses((selector) => {
            const { value } = selector;
            if (!noises.has(value)) {
              noises.set(value, noise());
            }
          });
        }).processSync(rule);

        rule.selector = rule.selector.replace(/(\.[-\w]+)/g, (match) => {
          const noise = noises.get(match.substring(1));

          if (noise) {
            return `.${noise}`;
          }

          return match;
        });
      });
    },
  };

  const { css: noizedCSS } = await postcss([noising]).process(css, {
    parser: parseCSS,
    from: undefined,
  });

  return noizedCSS;
}

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

const filtered = data.flat().filter(hasCSS).filter(notYetUsed);

const processed = [];

for (const item of filtered) {
  const { utility, css } = item;
  processed.push({
    css,
    prompt: (await noiseSelectors(css)) + '\nTW:',
    completion: ` ${utility};`,
  });
}

// console.log(JSON.stringify(processed.slice(0, 100), null, 2));
console.log(JSON.stringify(processed, null, 2));
// console.log(processed.length);
