import chalk from 'chalk';
import pg from 'pg';

const client = new pg.Client();

await client.connect();

const {
  rows: [{ count }],
} = await client.query(`SELECT COUNT(*) as count FROM tailwindcss`);

console.log(chalk.green(`Total: ${count}`));

await client.end();
