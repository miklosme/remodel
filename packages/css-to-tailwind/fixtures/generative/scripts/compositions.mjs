import path from 'path';
import { promises as fs } from 'fs';
import { URL } from 'url';

const __dirname = new URL('.', import.meta.url).pathname;

const data = JSON.parse(
  await fs.readFile(path.resolve(__dirname, '../utilities.json'), 'utf8'),
);

function choose(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, i) => i + start);
}

class Bag {
  constructor(name, items) {
    this.name = name;
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

const bags = new Set(
  Object.entries(data).reduce((acc, [pluginName, value]) => {
    if (value.length === 0) return acc;
    if (pluginName.match(/color/i)) return acc;
    return [...acc, new Bag(pluginName, value)];
  }, []),
);

const result = [];

while (true) {
  const composition = {};
  const size = choose(range(4, 8));

  for (let i = 0; i < size; i++) {
    if (bags.size === 0) break;

    const bag = choose(Array.from(bags));

    composition[bag.name] = bag.take();

    if (bag.isEmpty()) {
      bags.delete(bag);
    }
  }

  // drop the useless ones
  if (Object.keys(composition).length) {
    result.push(composition);
  }

  if (bags.size === 0) break;
}

await fs.writeFile(
  path.resolve(__dirname, `../compositions.json`),
  JSON.stringify(result, null, 2),
);
