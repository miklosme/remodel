import { promises as fs } from 'fs';
import { URL } from 'url';
import path from 'path';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import prettier from 'prettier';

const __dirname = new URL('.', import.meta.url).pathname;

function formatCSS(css) {
  return prettier.format(css, {
    parser: 'css',
    printWidth: 100,
  });
}

async function resolveTailwindUtilities(utilities) {
  const config = {
    content: [{ raw: `<div class="${utilities}"></div>` }],
    theme: {},
    corePlugins: { preflight: false },
  };

  const input = `
    @tailwind utilities;
  `;

  const { css } = await postcss(tailwindcss(config)).process(input, {
    from: 'tailwind.css',
  });

  return formatCSS(css);
}

const data = JSON.parse(
  await fs.readFile(path.resolve(__dirname, 'utilities.json'), 'utf8'),
);

const utilities = Object.values(data).flat();

const results = Object.fromEntries(
  await Promise.all(
    utilities.map(async (utility) => {
      const resolvedUtility = await resolveTailwindUtilities(utility);
      return [utility, resolvedUtility];
    }),
  ),
);

await fs.writeFile(
  path.resolve(__dirname, 'utilities-resolved.json'),
  JSON.stringify(results, null, 2),
);
