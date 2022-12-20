import { makeCSSToTailwindPrompt } from '../../src/index.mjs';
import { promises as fs } from 'fs';
import prettier from 'prettier';

// prettier-ignore
const files = [
  './all_utilities.json',
  './all_compositions.json',
];

const content = await Promise.all(
  files.map(async (file) => {
    const content = await fs.readFile(file, 'utf8');
    return JSON.parse(content);
  }),
);

const data = content
  .flat()
  .sort(() => Math.random() - 0.5)
  .map((item) => {
    const { processedCSS, tailwind } = item;
    return {
      processedCSS: prettier.format(processedCSS, { parser: 'css' }),
      tailwind,
    };
  });

const result = Array.from({ length: Math.floor(data.length / 3) }, (_, i) => {
  const index = i * 3;
  return {
    input: data[index + 2].processedCSS,
    answer: data[index + 2].tailwind,
    examples: [
      [data[index].processedCSS, data[index].tailwind],
      [data[index + 1].processedCSS, data[index + 1].tailwind],
    ],
  };
}).map(({ input, answer, examples }) => {
  return {
    prompt: makeCSSToTailwindPrompt(input, examples),
    completion: ` ${answer};`,
  };
});

// console.log(data.length);
console.log(JSON.stringify(result, null, 2));

// result.slice(0, 10).forEach(({ prompt, completion }) => {
//   console.log(prompt);
//   console.log(completion);
// });
