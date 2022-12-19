import { normalizeShorthandsInCSS } from './normalize-shorthands';
import { Configuration, OpenAIApi } from 'openai';

export default async function cssToTailwind(css) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing env.OPENAI_API_KEY');
  }

  const normalizedCSS = await normalizeShorthandsInCSS(css);

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  const completion = await openai.createCompletion({
    model: 'text-davinci-002',
    prompt: makeCSSToTailwindPrompt(normalizedCSS),
  });

  const [error, classes] = parseCompletion(completion.data.choices[0].text);

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
