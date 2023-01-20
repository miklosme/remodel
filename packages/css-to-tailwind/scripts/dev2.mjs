import { utilitiesFromCache } from '../src/cache.mjs';
import { normalize } from '../src/normalize.mjs';
import { tokenizeUtility } from '../src/utils.mjs';
import { validate } from '../src/validate.mjs';
import { entriesToCSS } from '../src/entries.mjs';
import { sendPrompt } from '../src/api.mjs';
import chalk from 'chalk';
import pg from 'pg';
import { promises as fs } from 'fs';
import path from 'path';
import { URL } from 'url';
import { addNoiseToCSS } from './noise.mjs';
import fetch from 'node-fetch';

const __dirname = new URL('.', import.meta.url).pathname;
const client = new pg.Client();

const utilityTypes = JSON.parse(
  await fs.readFile(
    path.resolve(__dirname, '../data/utility-types.json'),
    'utf8',
  ),
);

const EVERY_UTILITIES_TYPES = new Set(Object.values(utilityTypes).flat());

const compositionResolved = JSON.parse(
  await fs.readFile(
    path.resolve(__dirname, '../data/compositions-resolved.json'),
    'utf8',
  ),
);

let CHOOSEN_COMPOSITION;

if (!process.env.CHOOSE) {
  const index = Math.floor(Math.random() * compositionResolved.length);
  CHOOSEN_COMPOSITION = compositionResolved[index];
  console.log('Composition ID is randomly choosen:', index);
} else {
  CHOOSEN_COMPOSITION = compositionResolved[process.env.CHOOSE];
  console.log('Composition ID is choosen from env:', process.env.CHOOSE);
}

let MODEL;

if (!process.env.MODEL) {
  MODEL = 'text-davinci-003';
  MODEL = 'text-davinci-003';
  MODEL = 'ada:ft-personal-2022-12-21-01-03-46';
  MODEL = 'text-ada-001';
  MODEL = 'code-davinci-002';
  console.log('Model used:', MODEL);
} else {
  MODEL = process.env.MODEL;
  console.log('Model is set from env:', MODEL);
}

function choose(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makePrompt({ property, value }) {
  const prompt = `

Rewrite the following CSS declarations to Tailwind CSS:

CSS:
border: 1px solid #000;
TW:
border-1 border-solid border-black

CSS:
margin-left: 1rem;
TW:
ml-4

CSS:
background-image: linear-gradient(to top, #eab308, #16a34a);
TW:
bg-gradient-to-t from-yellow-500 to-green-600

CSS:
${property}: ${value};
TW:

`.trim();

  const params = {
    prompt,
    model: MODEL,
    temperature: 0,
    top_p: 1,
    max_tokens: 256,
    frequency_penalty: 0,
    presence_penalty: 0,
    stop: ['CSS:'],
  };

  return { prompt, params };
}

function parseCompletion(completion, holder) {
  try {
    const declarations = completion.trim().split(' ').filter(Boolean);

    return [null, declarations];
  } catch (e) {
    console.log('Error parsing completion: ', completion);
    return [e, null];
  }
}

async function utilitiesFromAI({ property, value }) {
  const promptHolder = makePrompt({ property, value });
  const { completion } = await sendPrompt(promptHolder);
  const [error, declarations] = parseCompletion(completion, promptHolder);

  if (error) {
    console.log(chalk.red(error));
    return [];
  }

  return declarations
    .map((utility) => {
      const token = tokenizeUtility(utility).join('-');

      if (EVERY_UTILITIES_TYPES.has(token)) {
        return {
          answer: utility,
          token,
          guesses: null,
        };
      }

      // throw new Error('Not implemented');

      // const cssProps = new Set(
      //   entriesFromCSS(promptHolder.css).map(([prop]) => prop),
      // );

      // const pool = Object.entries(utilityTypes).reduce((acc, [prop, utilities]) => {
      //   if (cssProps.has(prop)) {
      //     return [...acc, ...utilities];
      //   }
      //   return acc;
      // }, []);

      // const result = findClosestMatch(token, pool);

      return {
        answer: utility,
        token: null,
        // guesses: result.guesses,
        guesses: null,
      };
    })
    .filter(Boolean);
}

//////////////
//////////////
//////////////

await client.connect();

const css = addNoiseToCSS(CHOOSEN_COMPOSITION.css);
// const entries = normalize(css).slice(0, 2);
const entries = normalize(css);
const normalizedCSS = entriesToCSS('.selector', entries);

const data = await Promise.all(
  entries.map(async (entry) => {
    const cache = await utilitiesFromCache(client, entry);
    // const smart = await utilitiesFromAI(entry);

    return {
      ...entry,
      cache: cache.map((item) => item.utility),
      // smart: smart.map((item) => item.token),
    };
  }),
);

console.log(chalk.green(JSON.stringify(data, null, 2)));
console.log(chalk.blue(normalizedCSS));

const result = data.flatMap((item) => {
  if (item.cache) {
    return [choose(item.cache)];
  }

  return [];
});

console.log('Recived:', chalk.green(result.join(' ')));
console.log('Expected:', chalk.blue(CHOOSEN_COMPOSITION.classList.join(' ')));

try {
  await validate({
    css: normalizedCSS,
    utilities: result,
    keepFiles: true,
  });
  console.log('✅ Valid');
} catch (e) {
  console.log('❌ Invalid');
  console.log(e);
}

await client.end();
