// TODO:
// - [ ] Normalize shorthands
// - [ ] Round values
// - [ ] Cache
// - [ ] Merge utilities

import chalk from 'chalk';
import { normalizeCSSShorthands } from '../src/normalize-shorthands.mjs';
import { roundCSSValues } from '../src/round.mjs';
import { entriesFromCSS } from '../src/entries.mjs';

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
