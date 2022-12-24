import path from 'path';
import { promises as fs } from 'fs';
import { URL } from 'url';

const __dirname = new URL('.', import.meta.url).pathname;

const data = JSON.parse(
  await fs.readFile(
    path.resolve(__dirname, '../utilities/utilities.json'),
    'utf8',
  ),
);

function choose(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, i) => i + start);
}

class Bag {
  constructor(items) {
    this.items = new Set(items);
  }
  isEmpty() {
    return this.items.size === 0;
  }
  take() {
    const item = choose([...this.items]);
    if (!item) throw new Error('Bag is empty');
    this.items.delete(item);
    return item;
  }
}

let bags = Object.entries(data).reduce((acc, [key, value]) => {
  if (value.length === 0) return acc;
  return [...acc, new Bag(value)];
}, []);

const result = [];

while (true) {
  const composition = [];
  const size = choose(range(4, 8));
  const usedBags = new Set();

  for (let i = 0; i < size; i++) {
    const options = bags.filter((b) => !usedBags.has(b));
    if (options.length === 0) break;

    const bag = choose(options);
    usedBags.add(bag);
    composition.push(bag.take());

    if (bag.isEmpty()) {
      bags = bags.filter((b) => b !== bag);
    }
  }

  result.push(composition);
  if (bags.length === 0) break;
}

await fs.writeFile(
  path.resolve(__dirname, `../compositions/compositions.json`),
  JSON.stringify(result, null, 2),
);

console.log(
  'Compositions with only 2 items:',
  result.filter((c) => c.length === 2).length,
);
console.log(
  'Compositions with only 1 item:',
  result.filter((c) => c.length === 1).length,
);
