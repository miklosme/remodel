import { validate } from '../src/validate.mjs';
import chalk from 'chalk';

const css = `
  .foo {
    margin: 0.75rem;
    border: 1px solid #fb923c;
    padding: 0.5rem;
    vertical-align: baseline;
    font-size: 1.125rem;
    line-height: 1.75rem;
    color: #22c55e;
  }
`;

const tw =
  'm-3 border border-solid border-orange-400 p-2 align-baseline text-lg text-green-500';

try {
  console.log(chalk.bold('CSS:'));
  console.log(css);
  console.log(chalk.bold('TW:'));
  console.log(tw);
  console.log();

  validate(css, tw);
  console.log('✅ Valid');
} catch (err) {
  console.log('❌ Invalid');
  console.log(err);
}
