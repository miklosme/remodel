import path from 'path';
import { promises as fs } from 'fs';
import postcss from 'postcss';
import postcssParse from 'postcss-safe-parser';
import tailwindcss from 'tailwindcss';
import prettier from 'prettier';
import { URL } from 'url';

const __dirname = new URL('.', import.meta.url).pathname;

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

const data = JSON.parse(
  await fs.readFile(path.resolve(__dirname, '../compositions.json'), 'utf8'),
);

const result = await Promise.all(
  data.slice(0, 20).map(async (composition) => {
    const classList = Object.values(composition);
    const resolved = await Object.entries(composition).reduce(
      async (prev, [key, value]) => {
        const acc = await prev;
        return {
          ...acc,
          [key]: await resolveTailwindUtilities(value),
        };
      },
      Promise.resolve({}),
    );
    const resolvedCSS = await resolveTailwindUtilities(classList.join(' '));
    const css = await mergeCSSRules(resolvedCSS);
    return {
      classList,
      resolved,
      css,
    };
  }),
);

await fs.writeFile(
  path.resolve(__dirname, '../compositions-resolved.json'),
  JSON.stringify(result, null, 2),
);
