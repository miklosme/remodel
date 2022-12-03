import { promises as fs } from 'fs';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import postcssParse from 'postcss-safe-parser';

function run(input, config) {
  return postcss(tailwindcss(config)).process(input, {
    from: 'tailwind.css',
  });
}

async function listSelectors(css) {
  const ast = await postcssParse(css);
  const selectors = [];
  ast.walkRules((rule) => {
    // debugger;
    selectors.push(rule.selector);
  });
  return selectors;
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
  debugger;
  return result;
}

// const cases = (await fs.readFile('./scripts/testcases.txt', 'utf8')).split(
const cases = (await fs.readFile('./scripts/onecase.txt', 'utf8')).split('\n');

const compiler = cases.map(async (classes) => {
  let config = {
    content: [{ raw: `<div class="${classes}"></div>` }],
    theme: {},
    corePlugins: { preflight: false },
  };

  let input = `
    @tailwind utilities;
  `;

  return run(input, config).then(async (result) => {
    return {
      classes,
      css: String.raw`${result.css}`,
      selectors: await listSelectors(result.css),
      mergedCss: await mergeClasses(result.css),
    };
  });
});

let results = await Promise.all(compiler);

await fs.writeFile(
  './scripts/testcases.json',
  JSON.stringify(results, null, 2),
);

console.log(`Done: ${results.length}/${cases.length}`);
console.log(results);
