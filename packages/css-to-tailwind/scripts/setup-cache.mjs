import pg from 'pg';

const client = new pg.Client();

await client.connect();

await client.query(`DROP TABLE IF EXISTS tailwindcss`);

// create table if not exists
await client.query(
  `CREATE TABLE IF NOT EXISTS tailwindcss (
    id SERIAL PRIMARY KEY,
    property TEXT NOT NULL,
    value TEXT NOT NULL,
    utilities TEXT NOT NULL
  )`,
);

// insert data
await client.query(
  `INSERT INTO tailwindcss (property, value, utilities) VALUES ($1, $2, $3)`,
  ['margin-left', '2.5rem', 'ml-10'],
);

console.log('Success');

await client.end();
