// TODO:
// - [x] Normalize shorthands
// - [x] Round values
// - [ ] Cache
// - [ ] Merge utilities

import { normalize } from '../src/normalize.mjs';
import chalk from 'chalk';
import pg from 'pg';

const client = new pg.Client();

await client.connect();

async function utilitiesFromCache({ property, value }) {
  const { rows } = await client.query(
    `SELECT * FROM tailwindcss WHERE property = $1 AND value = $2`,
    [property, value],
  );

  return rows;
}

const css = `
  .selector {
    margin: 2rem 17px;
    color: #4f2b52;
    background: url('/image.png');
    transition-duration: 501ms;
  }
`;

const normalized = normalize(css);

const entriesWithCache = await Promise.all(
  normalized.map(async (entry) => {
    const cache = await utilitiesFromCache(entry);

    return {
      ...entry,
      cache,
    };
  }),
);

await client.end();

console.log(chalk.green(JSON.stringify(entriesWithCache, null, 2)));
