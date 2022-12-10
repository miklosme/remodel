import path from 'path';
import { promises as fs } from 'fs';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import prettier from 'prettier';
import { URL } from 'url';

const __dirname = new URL('.', import.meta.url).pathname;

async function resolveTailwindUtilities(utilities) {
  const config = {
    content: [{ raw: `<div class="${utilities}"></div>` }],
    theme: {},
    corePlugins: { preflight: false },
  };

  const input = `
    @tailwind utilities;
  `;

  return await postcss(tailwindcss(config)).process(input, {
    from: 'tailwind.css',
  });
}

// list files in the sibling directory "utilitis", when matches the pattern "*.utilities.txt"
const utilityFiles = (
  await fs.readdir(path.join(__dirname, '../utilities'), {
    withFileTypes: true,
  })
)
  .filter((file) => file.isFile() && file.name.endsWith('.utilities.txt'))
  .map((file) => file.name);

const tasks = utilityFiles.map((file) => async () => {
  console.log('Processing:', file);

  const content = await fs.readFile(
    path.join(__dirname, '../utilities', file),
    'utf8',
  );
  const utilities = content.split('\n');

  const result = await Promise.all(
    utilities.map(async (utility) => {
      const { css } = await resolveTailwindUtilities(utility);

      const formatted = prettier.format(css, {
        parser: 'css',
        printWidth: 100,
      });

      return { utility, css: formatted };
    }),
  );

  console.log(result);

  const data = JSON.stringify(result, null, 2);
  const jsonFile = `${file.replace(/\.utilities\.txt$/, '')}.utilities.json`;
  await fs.writeFile(path.resolve(__dirname, jsonFile), data, 'utf8');

  console.log('Done:', jsonFile);
});

for await (const task of tasks) {
  await task();
}
