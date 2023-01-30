import React from 'react';
import ReactPrompt from '../src/reconciler.mjs';

function App() {
  return (
    <model name="smart">
      <instruction>
        What year was Barack Obama elected first times as POTUS?
      </instruction>
      <result id="obama_potus" />
    </model>
  );
}

const OpenAI = {
  name: 'OpenAI',
  query({ params }) {
    return fetch('https://api.openai.com/v1/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(params),
    });
  },
};

const prompt = ReactPrompt.config({
  smart: {
    provider: OpenAI,
    model: 'text-davinci-003',
  },
});

const result = await prompt.run(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

console.log('Result to the question is:', result['obama_potus']);
