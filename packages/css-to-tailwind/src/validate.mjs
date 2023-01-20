import postcss from 'postcss';
import parseCSS from 'postcss-safe-parser';
import tailwindcss from 'tailwindcss';
import { chromium } from 'playwright';
import { getCompactCSS } from './utils.mjs';
import { promises as fs } from 'fs';
import chalk from 'chalk';
import childProcess from 'child_process';
import path from 'path';
import { URL } from 'url';

const __dirname = new URL('.', import.meta.url).pathname;

async function utilitiesToCSS(utilities) {
  if (Array.isArray(utilities)) {
    utilities = utilities.join(' ');
  }

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

  return postCSSResult.css;
}

function getFilePrefix() {
  const date = new Date()
    .toISOString()
    .replace(/:/g, '-')
    .replace(/T/g, '-')
    .slice(0, 19);

  const randomHash = Math.random().toString(36).slice(2);

  return `${date}_${randomHash}`;
}

function getSelector(css) {
  const ast = parseCSS(css);
  let result;
  ast.walkRules((rule) => {
    if (result) {
      throw new Error('CSS used for validation can only contain one rule');
    }
    result = rule.selector;
  });
  return result;
}

function getContent({ css, className, text = 'Lorem ipsum dolor sit amet.' }) {
  return `
  <style>
    #container {
      border: 1px solid black;
    }

    #container > div {
      padding: 5px;
      margin: 5px;
      border: 1px solid black;
    }
    
    ${css}
  </style>
  <div id="container">
    <div>
      <div class="${className}">${text}</div>
    </div>
  </div>
`;
}

export async function validate(arg) {
  const { css, utilities, saveScreenshotFiles = false, log = false } = arg;

  const cssFromUtilities = await utilitiesToCSS(utilities);

  if (log) {
    console.log('[validate][css]', chalk.blue(getCompactCSS(css)));
    console.log('[validate][utilities]', chalk.green(utilities.join(' ')));
    console.log(
      '[validate][cssFromUtilities]',
      chalk.green(getCompactCSS(cssFromUtilities)),
    );
    console.log();
  }

  const contextConfig = {
    viewport: { width: 400, height: 400 },
    deviceScaleFactor: 2,
  };

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext(contextConfig);
  const page = await context.newPage();

  await page.setContent(getContent({ css, className: getSelector(css) }));
  const bufferA = await page.locator('#container').screenshot();

  await page.setContent(
    getContent({ css: cssFromUtilities, className: utilities.join(' ') }),
  );
  const bufferB = await page.locator('#container').screenshot();

  await browser.close();

  if (saveScreenshotFiles) {
    const location = path.resolve(__dirname, `../screenshots`);
    const filePrefix = getFilePrefix();

    await fs.writeFile(`${location}/${filePrefix}_from_css.png`, bufferA);
    await fs.writeFile(`${location}/${filePrefix}_from_utilities.png`, bufferB);

    try {
      // check if "magick" is available
      childProcess.execSync('magick --version', { stdio: 'ignore' });
    } catch (err) {
      console.warn(
        'ImageMagick is not available, skipping diff image generation',
      );
    }

    try {
      const command = [
        'magick compare',
        '-verbose',
        '-metric mae',
        `${location}/${filePrefix}_from_css.png`,
        `${location}/${filePrefix}_from_utilities.png`,
        `${location}/${filePrefix}_diff.png`,
      ];

      childProcess.execSync(command.join(' '), {
        // do not throw error if command fails
        stdio: 'ignore',
      });
    } catch (err) {}

    console.log(`Diff image generated at ${location}/${filePrefix}_diff.png`);
  }

  if (!bufferA.equals(bufferB)) {
    throw new Error('[validate] Visual diff test did not pass');
  }
}
