import path from 'path';
import { promises as fs } from 'fs';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import prettier from 'prettier';
import { URL } from 'url';

const __dirname = new URL('.', import.meta.url).pathname;

async function resolveTailwindUtilities(composition) {
  const config = {
    content: [{ raw: `<div class="${composition}"></div>` }],
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

const utilityFiles = (
  await fs.readdir(path.join(__dirname, '../compositions'), {
    withFileTypes: true,
  })
)
  .filter((file) => file.isFile() && file.name.endsWith('.compositions.txt'))
  .map((file) => file.name);

const tasks = utilityFiles.map((file) => async () => {
  console.log('Processing:', file);

  const content = await fs.readFile(
    path.join(__dirname, '../compositions', file),
    'utf8',
  );
  const compositions = content.split('\n');

  const result = await Promise.all(
    compositions.map(async (composition) => {
      const { css } = await resolveTailwindUtilities(composition);

      const formatted = prettier.format(css, {
        parser: 'css',
        printWidth: 100,
      });

      return { composition, css: formatted };
    }),
  );

  console.log(result);

  const data = JSON.stringify(result, null, 2);
  const jsonFile = `${file.replace(
    /\.compositions\.txt$/,
    '',
  )}.compositions.json`;
  await fs.writeFile(path.resolve(__dirname, jsonFile), data, 'utf8');

  console.log('Done:', jsonFile);
});

for await (const task of tasks) {
  await task();
}
