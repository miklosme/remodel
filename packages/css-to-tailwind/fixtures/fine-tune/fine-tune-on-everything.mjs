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

const BATCH_SIZE_PER_FILE = 20;

const result = Array.from(
  { length: Math.floor(data.length / BATCH_SIZE_PER_FILE) },
  (_, i) => {
    const index = i * 3;
    return {
      input: data[index].processedCSS,
      answer: data[index].tailwind,
      examples: Array.from({ length: BATCH_SIZE_PER_FILE - 1 }, (_, j) => {
        const exampleIndex = (index + j + 1) % data.length;
        return [data[exampleIndex].processedCSS, data[exampleIndex].tailwind];
      }),
    };
  },
).map(({ input, answer, examples }) => {
  return {
    prompt: makeCSSToTailwindPrompt(input, examples),
    completion: ` ${answer};`,
  };
});

console.log(result.length);
// console.log(JSON.stringify(result, null, 2));

// result.slice(0, 10).forEach(({ prompt, completion }) => {
//   console.log(prompt);
//   console.log(completion);
// });
