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
  .map(([key, css]) => {
    const ast = parseCSS(css);
    const properties = [];
    ast.walkDecls((decl) => {
      if (!decl.prop.startsWith('--tw-')) {
        properties.push(decl.prop);
      }
    });
    return [tokenizeUtility(key).join('-'), properties];
  })
  .reduce((acc, [key, properties]) => {
    if (acc[key]) {
      properties.forEach((prop) => {
        if (!acc[key].includes(prop)) {
          acc[key].push(prop);
        }
      });
    } else {
      acc[key] = properties;
    }

    return acc;
  }, {});

await fs.writeFile(
  path.resolve(__dirname, 'utility-types.json'),
  JSON.stringify(results, null, 2),
);
