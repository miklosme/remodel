import { promises as fs } from 'fs';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';

function run(input, config) {
  return postcss(tailwindcss(config)).process(input, {
    from: 'tailwind.css',
  });
}

const cases = (await fs.readFile('./scripts/testcases.txt', 'utf8')).split(
  '\n',
);

const compiler = cases.map(async (classes) => {
  let config = {
    content: [{ raw: `<div class="${classes}"></div>` }],
    theme: {},
    corePlugins: { preflight: false },
  };

  let input = `
    @tailwind utilities;
  `;

  return run(input, config).then((result) => {
    return {
      classes,
      css: String.raw`${result.css}`,
      mergedCss: 'TODO',
    };
  });
});

let results = await Promise.all(compiler);

await fs.writeFile(
  './scripts/testcases.json',
  JSON.stringify(results, null, 2),
);
console.log(`Done: ${results.length}/${cases.length}`);
