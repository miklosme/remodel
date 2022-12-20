import { normalizeShorthandsInCSS } from './normalize-shorthands.mjs';
import { hashCSS } from './hash.mjs';
import fetch from 'node-fetch';

export default async function cssToTailwind(css) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing env.OPENAI_API_KEY');
  }

  const normalizedCSS = await normalizeShorthandsInCSS(css);
  const hash = hashCSS(normalizedCSS);

  const resp = await fetch('https://api.openai.com/v1/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      // model: 'text-davinci-003',
      // model: 'code-davinci-002',
      // model: 'ada:ft-personal-2022-12-20-01-20-32',
      model: 'text-ada-001',
      prompt: makeCSSToTailwindPrompt(normalizedCSS),
      temperature: 0,
      max_tokens: 256,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      stop: [';'],
    }),
  });

  const completion = await resp.json();

  if (completion.error) {
    throw new Error(`OpenAI API error: ${completion.error.message}`);
  }

  const [error, classes] = parseCompletion(completion.choices[0].text);

  if (error) {
    throw error;
  }

  return {
    classes,
    hash,
  };
}

function parseCompletion(completion) {
  try {
    const result = completion.trim().split(' ').filter(Boolean);

    return [null, result];
  } catch (e) {
    return [e, null];
  }
}

export function makeCSSToTailwindPrompt(css, examples = []) {
  return `
Convert the following CSS to Tailwind CSS classes. Use as few classes as possible.

${examples.map(([css, tw]) => `CSS:\n${css}\nTW:\n${tw};`).join('\n\n')}

CSS:
${css}
TW:
  `.trim();
}
