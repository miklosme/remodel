import { promises as fs } from 'fs';
import { URL } from 'url';
import path from 'path';

const __dirname = new URL('.', import.meta.url).pathname;

const resolvedUtilities = JSON.parse(
  await fs.readFile(
    path.resolve(__dirname, '../utilities-resolved.json'),
    'utf8',
  ),
);

const utilitiesJSON = JSON.parse(
  await fs.readFile(path.resolve(__dirname, '../utilities.json'), 'utf8'),
);

// implement any filtering you want here
const result = Object.entries(utilitiesJSON).map(([key, utilities]) => {
  const filtered = utilities.filter((utilities) => {
    const css = resolvedUtilities[utilities];
    return !css.includes('--tw-');
  });

  return [key, filtered];
});

await fs.writeFile(
  path.resolve(__dirname, '../utilities-filtered.json'),
  JSON.stringify(Object.fromEntries(result), null, 2),
);
