import path from 'path';
import { promises as fs } from 'fs';

const files = process.argv.slice(2).map((file) => path.resolve(file));

const tasks = files.map(async (file) => {
  const content = await fs.readFile(file, 'utf8');

  // use regex to collect all the classes
  const classes = content.match(/className="([^"]+)"/g);

  if (!classes) {
    return [];
  }

  const allClasses = classes.map((className) =>
    className.replace(/className="([^"]+)"/, '$1'),
  );

  return allClasses;
});

const data = await Promise.all(tasks);

const utilities = Array.from(
  new Set(
    data.flatMap((classes) =>
      classes.flatMap((x) => x.split(' ').filter(Boolean)),
    ),
  ),
).sort();

console.log(utilities.join('\n'));
