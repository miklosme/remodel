import postcss from 'postcss';
import parseCSS from 'postcss-safe-parser';
import tailwindcss from 'tailwindcss';
import { chromium } from 'playwright';
import { promises as fs } from 'fs';
import childProcess from 'child_process';
import path from 'path';
import { URL } from 'url';

const __dirname = new URL('.', import.meta.url).pathname;

async function utilitiesToCSS(utilities) {
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

const LOREM_IPSUM = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam nec feugiat arcu. Pellentesque sed nunc vehicula, egestas erat sodales, iaculis elit. In placerat laoreet mauris non volutpat.`;

export async function validate({ css, utilities, keepFiles = false }) {
  const cssSelector = getSelector(css);
  const cssFromUtilities = await utilitiesToCSS(utilities);

  const contextConfig = {
    viewport: { width: 400, height: 400 },
    deviceScaleFactor: 2,
  };

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext(contextConfig);
  const page = await context.newPage();

  await page.setContent(`
    <style>
      #container {
        padding: 5px;
      }
      
      ${css}
    </style>
    <div id="container">
      <div class="${cssSelector.replace(/^\./, '')}">${LOREM_IPSUM}</div>
    </div>
  `);

  const bufferA = await page.locator('#container').screenshot();

  await page.setContent(`
    <style>
      #container {
        padding: 5px;
      }

      ${cssFromUtilities}
    </style>
    <div id="container">
      <div class="${utilities}">${LOREM_IPSUM}</div>
    </div>
  `);

  const bufferB = await page.locator('#container').screenshot();

  await browser.close();

  if (!bufferA.equals(bufferB)) {
    if (keepFiles) {
      const location = path.resolve(__dirname, `../screenshots`);
      const filePrefix = getFilePrefix();

      await fs.writeFile(`${location}/${filePrefix}_from_css.png`, bufferA);
      await fs.writeFile(
        `${location}/${filePrefix}_from_utilities.png`,
        bufferB,
      );

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

        console.log(
          `Diff image generated at ${location}/${filePrefix}_diff.png`,
        );
      } catch (err) {}
    }

    throw new Error('CSS and utilities do not match');
  }
}
