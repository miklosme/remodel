import { assert, expect, test } from 'vitest';
import path from 'path';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import prettier from 'prettier';
import { diff } from 'jest-diff';

const css = String.raw;

function format(input) {
  return prettier.format(input, {
    parser: 'css',
    printWidth: 100,
  });
}

expect.extend({
  // Compare two CSS strings with all whitespace removed
  // This is probably naive but it's fast and works well enough.
  toMatchCss(received, argument) {
    function stripped(str) {
      return str.replace(/\s/g, '').replace(/;/g, '');
    }

    const options = {
      comment: 'stripped(received) === stripped(argument)',
      isNot: this.isNot,
      promise: this.promise,
    };

    const pass = stripped(received) === stripped(argument);

    const message = pass
      ? () => {
          return (
            this.utils.matcherHint(
              'toMatchCss',
              undefined,
              undefined,
              options,
            ) +
            '\n\n' +
            `Expected: not ${this.utils.printExpected(format(received))}\n` +
            `Received: ${this.utils.printReceived(format(argument))}`
          );
        }
      : () => {
          const actual = format(received);
          const expected = format(argument);

          const diffString = diff(expected, actual, {
            expand: this.expand,
          });

          return (
            this.utils.matcherHint(
              'toMatchCss',
              undefined,
              undefined,
              options,
            ) +
            '\n\n' +
            (diffString && diffString.includes('- Expect')
              ? `Difference:\n\n${diffString}`
              : `Expected: ${this.utils.printExpected(expected)}\n` +
                `Received: ${this.utils.printReceived(actual)}`)
          );
        };

    return { actual: received, message, pass };
  },
});

function run(input, config) {
  let { currentTestName } = expect.getState();

  return postcss(tailwindcss(config)).process(input, {
    from: `${path.resolve(__filename)}?test=${currentTestName}`,
  });
}

test('tailwind css', async () => {
  let config = {
    content: [{ raw: `<div class="bg-green-light bg-green"></div>` }],
    theme: {
      colors: {
        green: {
          light: 'green',
        },
      },
    },
    corePlugins: { preflight: false },
  };

  let input = `
    @tailwind utilities;

    .bg-green {
      /* Empty on purpose */
    }
  `;

  return run(input, config).then((result) => {
    expect(result.css).toMatchCss(css`
      .bg-green-light {
        --tw-bg-opacity: 1;
        background-color: rgb(0 128 0 / var(--tw-bg-opacity));
      }
      .bg-green {
        /* Empty on purpose */
      }
    `);
  });
});
