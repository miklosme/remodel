import { promises as fs } from 'fs';
import prettier from 'prettier';
import path from 'path';
import { URL } from 'url';

const __dirname = new URL('.', import.meta.url).pathname;

const files = ['./simple.json', './advanced.json', './complex.json'];

const contents = await Promise.all(
  files.map(async (file) => {
    const result = JSON.parse(
      await fs.readFile(path.resolve(__dirname, file), 'utf8'),
    );

    return result.map((r, index) => ({
      ...r,
      fileName: path.basename(file).split('.')[0],
      fileIndex: String(index + 1).padStart(3, '0'),
    }));
  }),
);

const content = contents.flat().map(makeTest);

console.log(content.join('\n'));

function styleDeclarationToCSS(style) {
  return Object.entries(style)
    .map(([media, entries]) => {
      if (media === '') {
        return `.selector {
${Object.entries(entries)
  .map(([property, value]) => `  ${property}: ${value};`)
  .join('\n')}
        }`;
      }

      return `@media ${media} {
  .selector {
${Object.entries(entries)
  .map(([property, value]) => `    ${property}: ${value};`)
  .join('\n')}
  }
}`;
    })
    .join('\n\n');
}

function formatCSS(css) {
  return prettier.format(css, {
    parser: 'css',
    printWidth: 100,
  });
}

function makeTest(testcase) {
  return `
  test('css-to-tailwind: ${testcase.fileName}-${testcase.fileIndex} (id: ${
    testcase.id
  })', async () => {
    // ID: ${testcase.id}

    const tailwindResult = await cssToTailwind(\`
${formatCSS(styleDeclarationToCSS(testcase.style))}\`);

    expect(tailwindResult.classes).toMatchTailwindClasses('${testcase.classList.join(
      ' ',
    )}');
  });
    `;
}
