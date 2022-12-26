import { makeCSSToTailwindPrompt } from '../src/index.mjs';
import parseCSS from 'postcss-safe-parser';
import { promises as fs } from 'fs';
import path from 'path';
import postcss from 'postcss';
import postcssParse from 'postcss-safe-parser';
import tailwindcss from 'tailwindcss';
import prettier from 'prettier';
import { URL } from 'url';

const __dirname = new URL('.', import.meta.url).pathname;

function choose(choices) {
  const index = Math.floor(Math.random() * choices.length);
  return choices[index];
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

const compositionresolved = JSON.parse(
  await fs.readFile(
    path.resolve(
      __dirname,
      '../fixtures/generative/compositions-resolved.json',
    ),
    'utf8',
  ),
);

function makeExample(resolved) {
  return Object.entries(resolved).flatMap(([utility, css]) => {
    const results = [];
    const ast = parseCSS(css);
    ast.walkDecls((decl) => {
      results.push([`${decl.prop}: ${decl.value}`, utility]);
    });
    if (results.length === 0) {
      throw new Error('No declarations in utility');
    }
    return results;
  });
}

function makePrompt() {
  const example = makeExample(choose(compositionresolved).resolved);
  return `
Rewrite the following CSS declarations to Tailwind CSS classes.

CSS:
${example
  .map(([declaration, utility], index) => `${index + 1}. ${declaration};`)
  .join('\n')}
TW:
${example
  .map(([declaration, utility], index) => `${index + 1}. ${utility};`)
  .join('\n')}
`;
}

function parseCompletion(completion) {
  try {
    const declarations = completion
      .split(';')
      .map((str) => str.trim())
      .filter(Boolean)
      .map((str) => str.trim().split('. ').filter(Boolean));

    const result = Object.fromEntries(declarations);

    return [null, result];
  } catch (e) {
    return [e, null];
  }
}

let [prompt, completion] = makePrompt().split('TW:');
prompt += 'TW:';

// console.log({ prompt, completion });

const [err, result] = parseCompletion(completion);

console.log(prompt);

console.log(result);

async function validateCompletion(completion) {
  const [err, result] = parseCompletion(completion);
  if (err) {
    throw err;
  }

  const css = await resolveTailwindUtilities(Object.values(result).join(' '));

  const mergedCSS = mergeCSSRules(css);

  console.log(mergedCSS);
}

await validateCompletion(completion);
console.log('OK');
