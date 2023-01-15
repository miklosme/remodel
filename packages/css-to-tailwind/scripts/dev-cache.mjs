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

  if (rows.length === 0) {
    return null;
  }

  const { utilities } = rows[0];

  return utilities;
}

// const css = `
//   .selector {
//     margin: 2rem 17px;
//     color: #4f2b52;
//     background: url('/image.png');
//     transition-duration: 501ms;
//   }
// `;
const css = `
  .selector {
    color: rgba(0, 40, 80, 0.5);
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
