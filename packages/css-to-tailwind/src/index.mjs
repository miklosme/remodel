import { normalizeShorthandsInCSS } from './normalize-shorthands.mjs';
// import { Configuration, OpenAIApi } from 'openai';
import fetch from 'node-fetch';

export default async function cssToTailwind(css) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing env.OPENAI_API_KEY');
  }

  const normalizedCSS = await normalizeShorthandsInCSS(css);

  // const openai = new OpenAIApi(
  //   new Configuration({
  //     apiKey: process.env.OPENAI_API_KEY,
  //   }),
  // );

  // const completion = await openai.createCompletion({
  //   model: 'text-davinci-002',
  //   prompt: makeCSSToTailwindPrompt(normalizedCSS),
  // });

  const resp = await fetch('https://api.openai.com/v1/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'text-davinci-003',
      prompt: makeCSSToTailwindPrompt(normalizedCSS),
      temperature: 0,
      max_tokens: 256,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      stop: ['=== TAILWIND END ==='],
    }),
  });

  const completion = await resp.json();

  const [error, classes] = parseCompletion(completion.choices[0].text);

  if (error) {
    throw error;
  }

  return {
    classes,
  };
}

function parseCompletion(completion) {
  console.log('received completion:', completion);

  const END_MARKER = '=== TAILWIND END ===';
  try {
    const result = completion.split(END_MARKER)[0].trim().split(' ');

    return [null, result];
  } catch (e) {
    return [e, null];
  }
}

function makeCSSToTailwindPrompt(css) {
  return `
Convert the following CSS to Tailwind CSS classes.

=== CSS START ===
.selector {
  margin-left: auto;
  height: 1.5rem;
  width: 1.5rem;
}
=== CSS END ===
=== TAILWIND START ===
h-6 ml-auto w-6
=== TAILWIND END ===

=== CSS START ===
${css}
=== CSS END ===
=== TAILWIND START ===

`.trim();
}
