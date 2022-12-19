import { promises as fs } from 'fs';

const content = await fs.readFile('./margin.utilities.json', 'utf8');
const data = JSON.parse(content);

const processed = data.map((item) => {
  const noise = () => {
    return Math.random()
      .toString(36)
      .substring(2, ((Math.random() * 10) | 0) + 10);
  };
  return {
    prompt: item.prompt.replace(/\W\.[a-z0-9-]+ {/g, () => `.${noise()} {`),
    completion: ' ' + item.completion,
  };
});

console.log(JSON.stringify(processed, null, 2));
