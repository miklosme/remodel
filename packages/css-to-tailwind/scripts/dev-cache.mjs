// TODO:
// - [ ] Normalize shorthands
// - [ ] Round values
// - [ ] Cache
// - [ ] Merge utilities

import chalk from 'chalk';
import { normalizeCSSShorthands } from '../src/normalize-shorthands.mjs';
import { roundCSSValues } from '../src/round.mjs';

const css = `
  .selector {
    margin: 2rem 17px;
    color: #4f2b52;
    background: url('/image.png');
    transition-duration: 501ms;
  }
`;
// const css = `
//   .selector {
//     transition-duration: 501ms;
//   }
// `;

const normalized = normalizeCSSShorthands(css);

const normalizedValues = roundCSSValues(normalized);

console.log(chalk.blue(css));

console.log(chalk.yellow(normalized));

console.log(chalk.green(normalizedValues));
