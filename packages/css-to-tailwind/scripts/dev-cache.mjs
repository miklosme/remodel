// TODO:
// - [x] Normalize shorthands
// - [x] Round values
// - [ ] Cache
// - [ ] Merge utilities

import chalk from 'chalk';
import { normalizeCSSShorthands } from '../src/normalize-shorthands.mjs';
import { roundCSSValues } from '../src/round.mjs';
import { entriesFromCSS } from '../src/entries.mjs';
import pg from 'pg';

const client = new pg.Client();

await client.connect();

async function utilitiesFromCache({ property, value }) {
  const { rows } = await client.query(
    `SELECT * FROM tailwindcss WHERE property = $1 AND value = $2`,
    [property, value],
  );

  if (rows.length === 0) {
    return null;
  }

  const { utilities } = rows[0];

  return utilities;
}

const css = `
  .selector {
    margin: 2rem 17px;
    color: #4f2b52;
    background: url('/image.png');
    transition-duration: 501ms;
  }
`;

const normalized = normalizeCSSShorthands(css);
const normalizedValues = roundCSSValues(normalized);
const entries = entriesFromCSS(normalizedValues);

console.log(css);
console.log(chalk.blue(normalized));
console.log(chalk.yellow(normalizedValues));
console.log(chalk.green(JSON.stringify(entries, null, 2)));

const entriesWithCache = await Promise.all(
  entries.map(async (entry) => {
    const cache = await utilitiesFromCache(entry);

    return {
      ...entry,
      cache,
    };
  }),
);

await client.end();

console.log(chalk.blue(JSON.stringify(entriesWithCache, null, 2)));
