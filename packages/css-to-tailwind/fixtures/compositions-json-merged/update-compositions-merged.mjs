import { chromium, devices } from 'playwright';
import { promises as fs } from 'fs';
import path from 'path';
import { URL } from 'url';

const __dirname = new URL('.', import.meta.url).pathname;

const urls = [
  'https://salient.tailwindui.com/',
  'https://transmit.tailwindui.com/',
  'https://keynote.tailwindui.com/',
  'https://primer.tailwindui.com/',
  'https://pocket.tailwindui.com/',
  'https://spotlight.tailwindui.com/',
  'https://syntax.tailwindui.com/',
];

function getMergedValues() {
  function getStyle(el) {
    const style = {};
    const css = [];
    for (const className of el.classList) {
      for (const sheet of document.styleSheets) {
        for (const rule of sheet.rules) {
          if (rule.selectorText === `.${className}`) {
            css.push(rule.cssText);

            for (const property of rule.style) {
              style[property] = rule.style[property];
            }
          }
        }
      }
    }
    return { style, css };
  }

  const list = Array.from(
    document.querySelectorAll('.flex.items-center.md\\:gap-x-12'),
  );

  return list
    .map((item) => {
      if (!item.classList.length) return null;
      return {
        composition: Array.from(item.classList).join(' '),
        ...getStyle(item),
      };
    })
    .filter(Boolean);
}

const browser = await chromium.launch();
const context = await browser.newContext(devices['Desktop Chrome HiDPI']);
const page = await context.newPage();

const tasks = [urls[0]].map((url) => async () => {
  console.log('Processing:', url);
  await page.goto(url);
  const result = await page.evaluate(getMergedValues);

  console.log(result);

  const data = JSON.stringify(result, null, 2);
  const file = `${url.replace(
    /https:\/\/|\.tailwindui\.com\//g,
    '',
  )}.compositions-merged.json`;
  await fs.writeFile(path.resolve(__dirname, file), data, 'utf8');
  console.log('Done:', url);
});

for (const task of tasks) {
  await task();
}

await context.close();
await browser.close();
