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
import fetch from 'node-fetch';

console.log = (...args) => {
  args.forEach((arg) => {
    if (typeof arg === 'string') {
      process.stdout.write(arg);
    } else {
      process.stdout.write(util.inspect(arg, { colors: true, depth: 6 }));
    }
    process.stdout.write(' ');
  });
  process.stdout.write('\n');
};

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
  console.log('Composition ID is randomly choosen:', index);
} else {
  CHOOSEN_COMPOSITION = compositionresolved[process.env.CHOOSE];
  console.log('Composition ID is choosen from env:', process.env.CHOOSE);
}

let MODEL;

if (!process.env.MODEL) {
  // MODEL = 'text-davinci-003';
  // MODEL = 'ada:ft-personal-2022-12-21-01-03-46';
  // MODEL = 'text-ada-001';
  MODEL = 'code-davinci-002';
  console.log('Model used:', MODEL);
} else {
  MODEL = process.env.MODEL;
  console.log('Model is set from env:', MODEL);
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

function renameSelectorInCSS(css, selector) {
  const ast = parseCSS(css);
  let oldSelector;
  ast.walkRules((rule) => {
    if (oldSelector) {
      throw new Error('More than one selector found');
    }
    oldSelector = rule.selector;
    rule.selector = selector;
  });
  return ast.toString();
}

function choose(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function range(start, step, end) {
  if (typeof end === 'undefined') {
    end = step;
    step = 1;
  }

  const result = [];
  for (let i = start; i <= end; i += step) {
    result.push(i);
  }
  return result;
}

function addNoiseToCSS(css) {
  const ast = parseCSS(css);
  ast.walkDecls((decl) => {
    decl.value = decl.value.replace(
      /(\d+\.?\d*(rem|px))/g,
      (match, float, measure) => {
        const number = parseFloat(float);

        if (typeof number !== 'number') {
          return float;
        }

        const noise =
          measure === 'px'
            ? choose(range(-5, 0.5, 5))
            : choose(range(-0.5, 0.05, 0.5));
        const newNumber = number + noise;
        return `${newNumber}${measure} /* ${float} */`;
      },
    );
  });
  return ast.toString();
}

function makePrompt() {
  console.log(CHOOSEN_COMPOSITION.css);
  console.log(
    renameSelectorInCSS(addNoiseToCSS(CHOOSEN_COMPOSITION.css), '.noised'),
  );
  process.exit(0);
  const css = Object.entries(CHOOSEN_COMPOSITION.resolved).map(
    ([utility, css], index) => {
      return [index + 1, entriesFromCSS(css)];
    },
  );

  const tw = Object.entries(CHOOSEN_COMPOSITION.resolved).map(
    ([utility, css], index) => {
      return [index + 1, utility];
    },
  );

  const fullPrompt = `
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
`.trim();

  const splittedPrompt = fullPrompt.split('TW:');
  const fakeCompletion = splittedPrompt.pop();
  const prompt = splittedPrompt.join('TW:') + 'TW:';

  return { prompt, fullPrompt, fakeCompletion, css, tw };
}

async function sendPrompt(prompt) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY');
  }

  const resp = await fetch('https://api.openai.com/v1/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      temperature: 0,
      top_p: 1,
      max_tokens: 256,
      frequency_penalty: 0,
      presence_penalty: 0,
      stop: ['CSS:'],
    }),
  });

  return await resp.json();
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
    console.log('Error parsing completion: ', completion);
    return [e, null];
  }
}

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
    console.log(promptHolder.css);

    console.log('Recived: (fake)');
    console.log(result);

    console.log('Resolved:');
    console.log(resolved);

    throw new Error('Sent and recived are not equal');
  }

  console.log('Recived: (fake)');
  console.log(result.flatMap(([_, utilities]) => utilities));

  // const mergedCSS = mergeCSSRules(css);

  // console.log(mergedCSS);
}

const promptHolder = makePrompt();

const realCompletion = await sendPrompt(promptHolder.prompt);

const realParse = parseCompletion(realCompletion.choices[0].text);
const fakeParse = parseCompletion(promptHolder.fakeCompletion);

console.log('Real:');
console.log(realParse);

console.log('Fake:');
console.log(fakeParse);

// await validateCompletion(completion);
// console.log('OK');
