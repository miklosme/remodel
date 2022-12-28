import { makeCSSToTailwindPrompt } from '../src/index.mjs';
import parseCSS from 'postcss-safe-parser';
import { promises as fs } from 'fs';
import path from 'path';
import postcss from 'postcss';
import postcssParse from 'postcss-safe-parser';
import tailwindcss from 'tailwindcss';
import prettier from 'prettier';
import util from 'util';
import deepEqual from 'deep-equal';
import { URL } from 'url';

const __dirname = new URL('.', import.meta.url).pathname;

const compositionresolved = JSON.parse(
  await fs.readFile(
    path.resolve(
      __dirname,
      '../fixtures/generative/compositions-resolved.json',
    ),
    'utf8',
  ),
);

let CHOOSEN_COMPOSITION;

if (!process.env.CHOOSE) {
  const index = Math.floor(Math.random() * compositionresolved.length);
  CHOOSEN_COMPOSITION = compositionresolved[index];
  console.log(
    'Composition ID is randomly choosen:',
    util.inspect(index, { colors: true }),
  );
} else {
  CHOOSEN_COMPOSITION = compositionresolved[process.env.CHOOSE];
  console.log(
    'Composition ID is choosen from env:',
    util.inspect(process.env.CHOOSE, { colors: true }),
  );
}

function formatCSS(css) {
  return prettier.format(css, {
    parser: 'css',
    printWidth: 100,
  });
}

async function resolveTailwindUtilities(utilities) {
  const config = {
    content: [{ raw: `<div class="${utilities}"></div>` }],
    theme: {},
    corePlugins: { preflight: false },
  };

  const input = `
    @tailwind utilities;
  `;

  const { css } = await postcss(tailwindcss(config)).process(input, {
    from: 'tailwind.css',
  });

  return formatCSS(css);
}

function mergeCSSRules(css) {
  const ast = postcssParse(css);
  const cssData = [];
  ast.walkRules((rule) => {
    const data = {};
    // debugger;

    data.selector = rule.selector;
    data.declarations = [];

    rule.nodes.forEach((node) => {
      if (node.type === 'decl') {
        data.declarations.push([node.prop, node.value]);
      } else {
        throw new Error('Unexpected node type: ' + node.type);
      }
    });

    data.atrule = null;

    if (rule.parent.type === 'atrule') {
      data.atrule = {
        name: rule.parent.name,
        params: rule.parent.params,
      };
    } else if (rule.parent.type === 'root') {
      // ignore
    } else {
      debugger;
      throw new Error('Unexpected parent type: ' + rule.parent.type);
    }

    cssData.push(data);
  });

  const result = Object.entries(
    cssData.reduce((acc, curr) => {
      const { selector, declarations, atrule } = curr;

      // TODO test selector if it's only a single class, and throw if not

      if (atrule) {
        let key = `@${atrule.name} ${atrule.params}`;
        acc[key] = acc[key] || {
          atrule,
          declarations: [],
        };

        acc[key].declarations.push(...declarations);
      } else {
        acc['null'] = acc['null'] || {
          atrule: null,
          declarations: [],
        };

        acc['null'].declarations.push(...declarations);
      }

      return acc;
    }, {}),
  )
    .map(([_, data]) => {
      if (data.atrule) {
        return `
        @${data.atrule.name} ${data.atrule.params} {
          .single {
            ${data.declarations
              .map(([prop, val]) => `  ${prop}: ${val};`)
              .join('\n')}
          }
        }
      `;
      } else {
        return `
        .single {
          ${data.declarations
            .map(([prop, val]) => `  ${prop}: ${val};`)
            .join('\n')}
        }
      `;
      }
    })
    .join('\n\n');

  return formatCSS(result);
}

function entriesFromCSS(css) {
  const ast = parseCSS(css);
  const results = [];
  ast.walkDecls((decl) => {
    results.push([decl.prop, decl.value]);
  });
  return results;
}

function makeExample(resolved) {
  const css = Object.entries(resolved).map(([utility, css], index) => {
    return [index + 1, entriesFromCSS(css)];
  });

  const tw = Object.entries(resolved).map(([utility, css], index) => {
    return [index + 1, utility];
  });

  return { css, tw };
}

function makePrompt() {
  const { css, tw } = makeExample(CHOOSEN_COMPOSITION.resolved);
  const prompt = `
Rewrite the following CSS declarations to Tailwind CSS classes.

CSS:
1. position: relative;
2. padding: 1.6rem 4.6rem;
3. margin-bottom: 1.6rem;
4. border: 1px solid #c53030;
5. color: #fff;
6. border-radius: 0.2rem;
7. width: 100%;
TW:
1. relative;
2. py-6 px-20;
3. mb-6;
4. border-red-700 border-solid border;
5. text-white;
6. rounded;
7. w-full;

CSS:
1. width: 100%;
2. display: flex;
3. justify-content: space-between;
4. align-items: center;
5. flex-direction: row-reverse;
6. padding: 2.4rem 3rem;
7. border-top: 1px solid #fff5f5;
TW:
1. w-full;
2. flex;
3. justify-between;
4. items-center;
5. flex-row-reverse;
6. pt-12 px-20;
7. border-t border-solid border-red-700;

CSS:
${css
  .map(([indexKey, declarations]) => {
    return `${indexKey}. ${declarations
      .map(([prop, val]) => `${prop}: ${val}`)
      .join('; ')};`;
  })
  .join('\n')}
TW:
${tw.map(([indexKey, utility]) => `${indexKey}. ${utility};`).join('\n')}
`;

  return { prompt, css, tw };
}

function parseCompletion(completion) {
  try {
    const declarations = completion
      .split(';')
      .map((str) => str.trim())
      .filter(Boolean)
      .map((str) => str.trim().split('. ').filter(Boolean))
      .map(([index, value]) => [Number(index), value.split(' ')]);

    return [null, declarations];
  } catch (e) {
    return [e, null];
  }
}

const promptHolder = makePrompt();
const splittedPrompt = promptHolder.prompt.split('TW:');
const completion = splittedPrompt.pop();
const prompt = splittedPrompt.join('TW:') + 'TW:';

// console.log(prompt);

// console.log({ prompt, completion });

const [err, result] = parseCompletion(completion);

// console.log(prompt);

async function validateCompletion(completion) {
  const [err, result] = parseCompletion(completion);
  if (err) {
    throw err;
  }

  const resolved = await Promise.all(
    result.map(async ([index, value]) => {
      const css = await resolveTailwindUtilities(value.join(' '));
      return [index, entriesFromCSS(css)];
    }),
  );

  const isEqual = deepEqual(resolved, promptHolder.css);

  if (!isEqual) {
    console.log('Sent data:');
    console.log(util.inspect(promptHolder.css, { depth: null, colors: true }));

    console.log('Recived: (fake)');
    console.log(result);

    console.log('Resolved:');
    console.log(util.inspect(resolved, { depth: null, colors: true }));

    throw new Error('Sent and recived are not equal');
  }

  console.log('Recived: (fake)');
  console.log(result.flatMap(([_, utilities]) => utilities));

  // const mergedCSS = mergeCSSRules(css);

  // console.log(mergedCSS);
}

await validateCompletion(completion);
console.log('OK');
