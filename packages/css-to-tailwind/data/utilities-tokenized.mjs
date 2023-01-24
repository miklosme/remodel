import { promises as fs } from 'fs';
import { URL } from 'url';
import path from 'path';
import parseCSS from 'postcss-safe-parser';
import { tokenizeUtility } from '../src/utils.mjs';

const __dirname = new URL('.', import.meta.url).pathname;

const resolvedUtilities = JSON.parse(
  await fs.readFile(path.resolve(__dirname, 'utilities-resolved.json'), 'utf8'),
);

const results = Object.entries(resolvedUtilities)
  .flatMap(([utility, css]) => {
    const tokens = tokenizeUtility(utility);
    const valueIndex = tokens.findIndex((token) => token === '$');

    if (valueIndex === -1) {
      return null;
    }

    const utilityValue = utility.split('-')[valueIndex];

    const results = [];
    const ast = parseCSS(css);
    ast.walkDecls((decl) => {
      if (!decl.prop.startsWith('--tw-')) {
        results.push({
          tokenized: tokens.join('-'),
          utilityValue,
          property: decl.prop,
          value: decl.value,
        });
      }
    });
    return results;
  })
  .filter(Boolean)
  .reduce((acc, { tokenized, utilityValue, property, value }) => {
    const data = [utilityValue, value];
    if (acc[tokenized]) {
      acc[tokenized].push(data);
    } else {
      acc[tokenized] = [data];
    }
    return acc;
  }, {});

await fs.writeFile(
  path.resolve(__dirname, 'utilities-tokenized.json'),
  JSON.stringify(results, null, 2),
);
