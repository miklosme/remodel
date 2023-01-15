import pg from 'pg';
import chalk from 'chalk';
import { promises as fs } from 'fs';
import { URL } from 'url';
import path from 'path';

const client = new pg.Client();

await client.connect();

await client.query(`DROP TABLE IF EXISTS tailwindcss`);

// create table if not exists
await client.query(
  `CREATE TABLE IF NOT EXISTS tailwindcss (
    id SERIAL PRIMARY KEY,
    property TEXT NOT NULL,
    value TEXT NOT NULL,
    utility TEXT NOT NULL
  )`,
);

const __dirname = new URL('.', import.meta.url).pathname;

const cache = JSON.parse(
  await fs.readFile(path.resolve(__dirname, '../data/cache.json'), 'utf8'),
);

console.log(`Now inserting ${cache.length} rows...`);

for (const [property, value, utility] of cache) {
  await client.query(
    `INSERT INTO tailwindcss (property, value, utility) VALUES ($1, $2, $3)`,
    [property, value, utility],
  );
}

const {
  rows: [{ count }],
} = await client.query(`SELECT COUNT(*) as count FROM tailwindcss`);

console.log(chalk.green(`Table size now: ${count}`));

console.log('Success');

await client.end();
