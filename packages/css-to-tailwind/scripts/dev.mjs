import parseCSS from 'postcss-safe-parser';
import { promises as fs } from 'fs';
import path from 'path';
import postcss from 'postcss';
import postcssParse from 'postcss-safe-parser';
import postcssValueParser from 'postcss-value-parser';
import tailwindcss from 'tailwindcss';
import resolveConfig from 'tailwindcss/resolveConfig.js';
import parseUnit from 'parse-unit';
import { levenshteinDistance } from '../src/levenshtein-distance.mjs';
import { tokenizeUtility } from '../src/utils.mjs';
import { normalizeCSSShorthands } from '../src/normalize-shorthands.mjs';
import prettier from 'prettier';
import util from 'util';
import deepEqual from 'deep-equal';
import { URL } from 'url';
import fetch from 'node-fetch';
import pg from 'pg';

const client = new pg.Client();

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
    path.resolve(__dirname, '../data/compositions-resolved.json'),
    'utf8',
  ),
);

const utilityTypes = JSON.parse(
  await fs.readFile(
    path.resolve(__dirname, '../data/utility-types.json'),
    'utf8',
  ),
);

const EVERY_UTILITIES_TYPES = new Set(Object.values(utilityTypes).flat());

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
  MODEL = 'text-davinci-003';
  MODEL = 'text-davinci-003';
  MODEL = 'ada:ft-personal-2022-12-21-01-03-46';
  MODEL = 'text-ada-001';
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

  const originalWarn = console.warn;
  let postCSSResult;
  try {
    // mute warnings coming from tailwindcss
    console.warn = () => {};

    postCSSResult = await postcss(tailwindcss(config)).process(input, {
      from: 'tailwind.css',
    });
  } finally {
    console.warn = originalWarn;
  }

  return formatCSS(postCSSResult.css);
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
    // add noise to size values
    decl.value = decl.value.replace(
      /(\d+\.?\d*(rem|px))/g,
      (match, float, measure) => {
        const number = parseFloat(float);

        if (typeof number !== 'number') {
          return float;
        }

        // ideally after normalization it will return to the original value
        // because we want to validate the transformation later
        // so let's use tiny values
        const noise = choose(range(-0.05, 0.01, 0.05));
        const newNumber = number + noise;
        return `${newNumber}${measure} /* ${float} */`;
      },
    );

    // add noise to color values
    decl.value = decl.value.replace(
      /#([0-9a-f]{6}|[0-9a-f]{3})/gi,
      (match, hex) => {
        if (hex.length === 3) {
          hex = hex
            .split('')
            .map((char) => char + char)
            .join('');
        }

        const number = parseInt(hex, 16);

        if (typeof number !== 'number') {
          return hex;
        }

        const r = (number >> 16) & 255;
        const g = (number >> 8) & 255;
        const b = number & 255;

        // ideally after normalization it should return to the original value
        // because we want to validate the transformation later
        // so let's use tiny values
        const newR = Math.floor(
          Math.max(0, Math.min(255, r + choose(range(-1, 0.1, 1)))),
        );
        const newG = Math.floor(
          Math.max(0, Math.min(255, g + choose(range(-1, 0.1, 1)))),
        );
        const newB = Math.floor(
          Math.max(0, Math.min(255, b + choose(range(-1, 0.1, 1)))),
        );

        const stringR = newR.toString(16).padStart(2, '0');
        const stringG = newG.toString(16).padStart(2, '0');
        const stringB = newB.toString(16).padStart(2, '0');

        const newHex = `#${stringR}${stringG}${stringB}`;

        const distance = Math.sqrt(
          Math.pow(r - newR, 2) + Math.pow(g - newG, 2) + Math.pow(b - newB, 2),
        ).toFixed(2);

        return `${newHex} /* distance: ${distance} */`;
      },
    );
  });
  return ast.toString();
}

function getResolvedTaiwindConfig() {
  return resolveConfig({
    content: ['./src/**/*.{js,ts,jsx,tsx}'],
    theme: {
      extend: {},
    },
    plugins: [],
  });
}

const defaultOptions = {
  COLOR_DELTA: 2,
  FULL_ROUND: 9999,
  REM: 16,
  EM: 16,
  PREPROCESSOR_INPUT:
    '@tailwind base;\n\n@tailwind components;\n\n@tailwind utilities;',
  TAILWIND_CONFIG: null,
};

function parseSize(val) {
  if (val === '0') {
    val = '0px';
  }

  let [value, unit] = parseUnit(val);

  unit = unit.trim();

  switch (unit) {
    case 'px':
      return { value, unit, px: value, original: val };
    case 'rem':
      return {
        value,
        unit,
        px: value * defaultOptions.REM,
        original: val,
      };
    case 'em':
      return {
        value,
        unit,
        px: value * defaultOptions.EM,
        original: val,
      };
    default:
      throw new Error(`Unknown unit: "${unit}"`);
  }
}

function parseColor(hex) {
  if (!hex.startsWith('#')) {
    throw new Error(`parseColor only accepts hex values, got: "${hex}"`);
  }

  let color = hex.replace('#', '');
  if (color.length === 3) {
    color = color
      .split('')
      .map((char) => char + char)
      .join('');
  }

  const r = (color >> 16) & 255;
  const g = (color >> 8) & 255;
  const b = color & 255;

  return {
    int: parseInt(color, 16),
    rgb: [r, g, b],
    original: hex,
  };
}

function getSizeBreakPoints(data) {
  return Object.values(data)
    .map((val) => {
      // values with extra data are arrays
      // for example: [ '0.875rem', { lineHeight: '1.25rem' } ],
      if (Array.isArray(val)) {
        val = val[0];
      }

      try {
        return parseSize(val);
      } catch (e) {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, z) => a.px - z.px);
}

function getColorBreakPoints(data) {
  let colors = [];

  Object.values(data).forEach((val) => {
    if (typeof val === 'string' && val.startsWith('#')) {
      colors.push(val);
    } else if (typeof val === 'object' && val !== null) {
      Object.values(val).forEach((val) => {
        if (typeof val === 'string' && val.startsWith('#')) {
          colors.push(val);
        }
      });
    }
  });

  colors = colors.map(parseColor).sort((a, z) => a.int - z.int);

  return colors;
}

function snapSizeToBreakpoint(value, breakPoints) {
  try {
    const { px } = parseSize(value);
    const closestBreakPoint = breakPoints.reduce((acc, curr) => {
      if (Math.abs(curr.px - px) < Math.abs(acc.px - px)) {
        return curr;
      } else {
        return acc;
      }
    });

    return closestBreakPoint.original;
  } catch (e) {
    return value;
  }
}

function snapColorToBreakpoint(value, breakPoints) {
  try {
    const { int, rgb } = parseColor(value);
    const closestBreakPoint = breakPoints.reduce((acc, curr) => {
      if (Math.abs(curr.int - int) < Math.abs(acc.int - int)) {
        return curr;
      } else {
        return acc;
      }
    });

    return closestBreakPoint.original;
  } catch (e) {
    return value;
  }
}

function normalizeCSSValues(css) {
  const { theme } = getResolvedTaiwindConfig();

  const colorPropsToSnap = [
    {
      props: ['color'],
      breakPoints: getColorBreakPoints(theme.textColor),
    },
    {
      props: ['fill'],
      breakPoints: getColorBreakPoints(theme.fill),
    },
    {
      props: ['stroke'],
      breakPoints: getColorBreakPoints(theme.stroke),
    },
    {
      props: ['background', 'background-color'],
      breakPoints: getColorBreakPoints(theme.backgroundColor),
    },
    {
      props: [
        'border',
        'border-color',
        'border-top-color',
        'border-right-color',
        'border-bottom-color',
        'border-left-color',
      ],
      breakPoints: getColorBreakPoints(theme.borderColor),
    },
  ];

  const noColorBreakpoints = colorPropsToSnap.some(
    (prop) => prop.breakPoints.length === 0,
  );
  if (noColorBreakpoints) {
    console.log(noColorBreakpoints);
    throw new Error('No colors found in tailwind config');
  }

  const sizePropsToSnap = [
    {
      props: [
        'padding',
        'padding-right',
        'padding-bottom',
        'padding-left',
        'padding-top',
      ],
      breakPoints: getSizeBreakPoints(theme.padding),
    },
    {
      props: [
        'margin',
        'margin-right',
        'margin-bottom',
        'margin-left',
        'margin-top',
      ],
      breakPoints: getSizeBreakPoints(theme.margin),
    },
    {
      props: ['width', 'min-width', 'max-width'],
      breakPoints: getSizeBreakPoints(theme.width),
    },
    {
      props: ['height', 'min-height', 'max-height'],
      breakPoints: getSizeBreakPoints(theme.height),
    },
    {
      props: ['font-size'],
      breakPoints: getSizeBreakPoints(theme.fontSize),
    },
    {
      props: [
        'border',
        'border-width',
        'border-top-width',
        'border-right-width',
        'border-bottom-width',
        'border-left-width',
      ],
      breakPoints: getSizeBreakPoints(theme.borderWidth),
    },
    // {
    // TODO: handle full rounding 9999px
    //   props: ['border-radius'],
    //   breakPoints: getSizeBreakPoints(theme.borderRadius),
    // },
    {
      props: ['line-height'],
      breakPoints: getSizeBreakPoints(theme.lineHeight),
    },
    {
      props: ['letter-spacing'],
      breakPoints: getSizeBreakPoints(theme.letterSpacing),
    },
    {
      props: ['gap', 'row-gap', 'column-gap'],
      breakPoints: getSizeBreakPoints(theme.gap),
    },
    {
      props: [
        'scroll-padding',
        'scroll-padding-right',
        'scroll-padding-bottom',
        'scroll-padding-left',
        'scroll-padding-top',
      ],
      breakPoints: getSizeBreakPoints(theme.scrollPadding),
    },
    {
      props: [
        'scroll-margin',
        'scroll-margin-right',
        'scroll-margin-bottom',
        'scroll-margin-left',
        'scroll-margin-top',
      ],
      breakPoints: getSizeBreakPoints(theme.scrollMargin),
    },
    {
      props: ['flex-basis'],
      breakPoints: getSizeBreakPoints(theme.flexBasis),
    },
    {
      props: ['top', 'right', 'bottom', 'left'],
      breakPoints: getSizeBreakPoints(theme.inset),
    },
    {
      props: ['text-decoration-thickness'],
      breakPoints: getSizeBreakPoints(theme.textDecorationThickness),
    },
    {
      props: ['outline-width'],
      breakPoints: getSizeBreakPoints(theme.outlineWidth),
    },
    {
      props: ['outline-offset'],
      breakPoints: getSizeBreakPoints(theme.outlineOffset),
    },
    {
      props: ['text-indent'],
      breakPoints: getSizeBreakPoints(theme.textIndent),
    },
  ];

  const noSizeBreakpoints = sizePropsToSnap.find(
    (item) => item.breakPoints.length === 0,
  );
  if (noSizeBreakpoints) {
    console.log(noSizeBreakpoints);
    throw new Error('No size breakpoints found');
  }

  const ast = parseCSS(css);

  ast.walkDecls((decl) => {
    const sizeBreakPoints = sizePropsToSnap.find((item) => {
      return item.props.includes(decl.prop);
    })?.breakPoints;
    const colorBreakPoints = colorPropsToSnap.find((item) => {
      return item.props.includes(decl.prop);
    })?.breakPoints;

    if (sizeBreakPoints || colorBreakPoints) {
      const valueAst = postcssValueParser(decl.value);
      valueAst.walk((node) => {
        if (sizeBreakPoints) {
          if (node.type === 'word') {
            node.value = snapSizeToBreakpoint(node.value, sizeBreakPoints);
            node.value = snapColorToBreakpoint(node.value, colorBreakPoints);
          }
        }
      });
      decl.value = valueAst.toString().trim();
    }
  });

  return ast.toString();
}

function makePrompt() {
  const { classList, css } = CHOOSEN_COMPOSITION;

  const processedCSS = normalizeCSSValues(
    addNoiseToCSS(normalizeCSSShorthands(css)),
  );
  const cssEntries = entriesFromCSS(processedCSS);

  const prompt = `

Rewrite the following CSS declarations to Tailwind CSS classes.

CSS:
1. background-blend-mode: luminosity;
2. mix-blend-mode: normal;
3. grid-column-end: 3;
4. fill: #871337;
5. line-height: 1.25;

TW:
1. bg-blend-luminosity;
2. mix-blend-normal;
3. col-end-3;
4. fill-rose-900;
5. leading-tight;

CSS:
1. appearance: none;
2. grid-row: span 1 / span 1;
3. scroll-snap-stop: always;
4. grid-auto-rows: max-content;
5. flex-wrap: wrap-reverse;
6. float: right;
7. table-layout: auto;

TW: 
1. appearance-none;
2. row-span-1;
3. snap-always;
4. auto-rows-max;
5. flex-wrap-reverse;
6. float-right;
7. table-auto;

CSS:
${cssEntries
  .map(([prop, val], index) => `${index + 1}. ${prop}: ${val};`)
  .join('\n')}

TW:

`.trim();

  const expectedRowCount = cssEntries.length;

  return { prompt, expectedRowCount, classList, css: processedCSS, cssEntries };
}

async function sendPrompt(prompt) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY');
  }

  if (!MODEL) {
    throw new Error('Missing MODEL');
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

  const json = await resp.json();

  return {
    completion: json.choices[0].text,
  };
}

function findClosestMatch(halucination, utilities) {
  const tokenDistances = {};
  let closestTokenDistance = null;
  for (const utility of utilities) {
    const distance = levenshteinDistance(
      tokenizeUtility(halucination),
      tokenizeUtility(utility),
    );
    if (distance <= 4) {
      tokenDistances[utility] = distance;
      if (closestTokenDistance === null || distance < closestTokenDistance) {
        closestTokenDistance = distance;
      }
    }
  }

  if (closestTokenDistance === null) {
    return {
      closestTokenDistance: null,
      guesses: [],
      topGuess: null,
      halucination,
    };
  }

  const guesses = Object.entries(tokenDistances)
    .filter(([, distance]) => distance === closestTokenDistance)
    .map(([utility]) => utility);
  const charDistances = {};
  let closestCharDistance = null;
  let topGuess = null;
  for (const candidate of guesses) {
    const distance = levenshteinDistance(halucination, candidate);
    charDistances[candidate] = distance;
    if (closestCharDistance === null || distance < closestCharDistance) {
      closestCharDistance = distance;
      topGuess = candidate;
    }
  }

  return {
    closestTokenDistance,
    guesses,
    topGuess,
    halucination,
  };
}

function parseCompletion(completion, { expectedRowCount }) {
  try {
    const declarations = [];

    for (let i = 0; i < expectedRowCount; i++) {
      const index = i + 1;
      const regex = new RegExp(`${index}\\. (.*);`);
      const match = completion.match(regex);
      if (!match) {
        throw new Error(`Could not find index ${index}`);
      }
      const utilities = match[1].split(' ').filter(Boolean);

      declarations.push([index, utilities]);
    }

    return [null, declarations];
  } catch (e) {
    console.log('Error parsing completion: ', completion);
    return [e, null];
  }
}

async function validateCompletion(parsed, promptHolder) {
  // const utilities = parsedUtilities.map((utility) => {
  //   if (!EVERY_UTILITIES_TYPES.has(utility)) {
  //     const result = findClosestMatch(utility, EVERY_UTILITIES_TYPES);
  //     if (result.topGuess) {
  //       return result.topGuess;
  //     }
  //   }
  //   return utility;
  // });

  // const debug = await Promise.all(
  //   parsed.map(async ([index, utilities]) => {
  //     const css = await resolveTailwindUtilities(utilities.join(' '));
  //     return {
  //       index,
  //       received: utilities,
  //       expected: promptHolder.classList,
  //       doesExists: utilities.reduce((acc, utility) => {
  //         return {
  //           ...acc,
  //           [utility]: EVERY_UTILITIES_TYPES.has(utility),
  //         };
  //       }, {}),
  //       receivedCSS: entriesFromCSS(css),
  //       // expectedCSS: promptHolder.css[index - 1][1],
  //     };
  //   }),
  // );

  // console.log('debug:', debug);

  const cssProps = new Set(
    entriesFromCSS(promptHolder.css).map(([prop]) => prop),
  );

  const pool = Object.entries(utilityTypes).reduce((acc, [prop, utilities]) => {
    if (cssProps.has(prop)) {
      return [...acc, ...utilities];
    }
    return acc;
  }, []);

  const result = parsed
    .flatMap(([index, utilities]) => utilities)
    .map((utility) => tokenizeUtility(utility).join('-'))
    .map((token) => {
      if (EVERY_UTILITIES_TYPES.has(token)) {
        return [token, null];
      }

      const result = findClosestMatch(token, pool);

      if (result.guesses.length) {
        return [token, result.guesses];
      }

      // LLM halucinated and we could not find a match
      return null;
    })
    .filter(Boolean);

  console.log('CSS:');
  console.log(promptHolder.cssEntries);

  console.log('Recived:');
  console.log(result);

  console.log('Expected:');
  console.log(promptHolder.classList.map((c) => tokenizeUtility(c).join('-')));
}

const promptHolder = makePrompt();

const { completion } = await sendPrompt(promptHolder.prompt);

const [err, parsed] = parseCompletion(completion, {
  expectedRowCount: promptHolder.expectedRowCount,
});

if (err) {
  throw err;
}

await validateCompletion(parsed, promptHolder);
