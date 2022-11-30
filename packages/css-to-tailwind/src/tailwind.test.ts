import { assert, expect, test } from 'vitest';
import path from 'path';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';

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
    expect(result.css).toMatchInlineSnapshot(`
      ".bg-green-light {


            --tw-bg-opacity: 1;


            background-color: rgb(0 128 0 / var(--tw-bg-opacity))
      }


          .bg-green {
            /* Empty on purpose */
          }
        "
    `);
  });
});
