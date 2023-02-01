import React from 'react';
import fetch from 'node-fetch';
import ReactPrompt from '../src/reconciler.mjs';

function App() {
  return (
    <model name="smart" temperature={0}>
      <instruction>
        What year was Barack Obama elected first times as POTUS?
      </instruction>
      <result id="obama_potus" />
    </model>
  );
}

const prompt = ReactPrompt.config({
  models: [
    {
      alias: 'smart',
      model: 'text-davinci-003',
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
    },
  ],
});

const result = await prompt.run(<App />);

console.log('Result:', result);
