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
    const utilityTokenized = tokenizeUtility(utility).join('-');
    const results = [];
    const ast = parseCSS(css);
    ast.walkDecls((decl) => {
      if (!decl.prop.startsWith('--tw-')) {
        results.push([decl.prop, utilityTokenized]);
      }
    });
    return results;
  })
  .reduce((acc, [property, utility]) => {
    if (acc[property]) {
      if (!acc[property].includes(utility)) {
        acc[property].push(utility);
      }
    } else {
      acc[property] = [utility];
    }

    return acc;
  }, {});

await fs.writeFile(
  path.resolve(__dirname, 'utility-types.json'),
  JSON.stringify(results, null, 2),
);
