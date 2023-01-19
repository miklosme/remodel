import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import { chromium } from 'playwright';
import { promises as fs } from 'fs';
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

const getScreenshotFilename = (suffix) => {
  const date = new Date()
    .toISOString()
    .replace(/:/g, '-')
    .replace(/T/g, '-')
    .slice(0, 19);

  const randomHash = Math.random().toString(36).slice(2);

  return path.resolve(
    __dirname,
    `../screenshots/${date}_${randomHash}_${suffix}`,
  );
};

export async function validate(css, utilities) {
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
      #main {
        padding: 10px;
      }
      
      ${css}
    </style>
    <div id="main">
      <div class="foo">foo bar</div>
    </div>
  `);

  const bufferA = await page.locator('#main').screenshot();

  await page.setContent(`
    <style>
      #main {
        padding: 10px;
      }

      ${cssFromUtilities}
    </style>
    <div id="main">
      <div class="${utilities}">foo bar</div>
    </div>
  `);

  const bufferB = await page.locator('#main').screenshot();

  await browser.close();

  if (!bufferA.equals(bufferB)) {
    await fs.writeFile(getScreenshotFilename('from_css.png'), bufferA);
    await fs.writeFile(getScreenshotFilename('from_utilities.png'), bufferB);

    throw new Error('CSS and utilities do not match');
  }
}
