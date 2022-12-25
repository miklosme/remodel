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

  const { css } = await postcss(tailwindcss(config)).process(input, {
    from: 'tailwind.css',
  });

  return prettier.format(css, {
    parser: 'css',
    printWidth: 100,
  });
}

const data = JSON.parse(
  await fs.readFile(
    path.resolve(__dirname, '../compositions/compositions.json'),
    'utf8',
  ),
);

const result = await Promise.all(
  data.slice(0, 20).map(async (composition) => {
    const classList = Object.values(composition);
    const css = await resolveTailwindUtilities(classList.join(' '));
    return {
      classList,
      css,
    };
  }),
);

await fs.writeFile(
  path.resolve(__dirname, '../compositions/compositions-resolved.json'),
  JSON.stringify(result, null, 2),
);
