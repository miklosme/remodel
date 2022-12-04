import path from 'path';
import { promises as fs } from 'fs';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import postcssParse from 'postcss-safe-parser';

function run(input, config) {
  return postcss(tailwindcss(config)).process(input, {
    from: 'tailwind.css',
  });
}

async function mergeClasses(css) {
  const ast = await postcssParse(css);
  const result = [];
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

    result.push(data);
  });

  const mergedCss = Object.entries(
    result.reduce((acc, curr) => {
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
    ${data.declarations.map(([prop, val]) => `    ${prop}: ${val};`).join('\n')}
  }
}
      `;
      } else {
        return `
.single {
  ${data.declarations.map(([prop, val]) => `  ${prop}: ${val};`).join('\n')}
}
      `;
      }
    })
    .join('\n\n');

  return mergedCss;
}

const files = process.argv.slice(2).map((file) => path.resolve(file));

const tasks = files.map(async (file) => {
  const content = await fs.readFile(file, 'utf8');

  let config = {
    content: [
      {
        // raw: `import React from 'react'; export default const App = () => <div class="mx-2 top-0"></div>;`,
        raw: content,
      },
    ],
    theme: {},
    corePlugins: { preflight: false },
  };

  let input = `
  @tailwind utilities;
`;

  return await run(input, config).then(async (result) => {
    const selectors = [];
    result.root.walkRules((rule) => {
      selectors.push(rule.selector);
    });
    // console.log(selectors)
    // debugger;
    // return {
    //   classes: 'TODO',
    //   css: String.raw`${result.css}`,
    //   mergedCss: await mergeClasses(result.css),
    // };

    return selectors;
  });
});

const data = await Promise.all(tasks);

const utilities = Array.from(new Set(data.flat())).sort();

console.log(utilities.join('\n'));
