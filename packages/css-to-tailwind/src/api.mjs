import fetch from 'node-fetch';

// TODO rate limit protection
// resp.status === 429

export async function sendPrompt({ params }) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY');
  }

  if (!params.model) {
    throw new Error('Missing MODEL');
  }

  const resp = await fetch('https://api.openai.com/v1/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(params),
  });

  const json = await resp.json();

  try {
    return {
      completion: json.choices[0].text,
      result: json,
    };
  } catch (e) {
    console.log('Error reading "json.choices[0].text" from response:');
    console.log(json);

    debugger;

    throw e;
  }
}
