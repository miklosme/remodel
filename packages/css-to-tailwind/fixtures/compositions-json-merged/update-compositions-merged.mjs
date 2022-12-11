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
  function getStyle(className) {
    let result = { __CSS__: '' };
    let classes = document.styleSheets[0].rules;
    for (var x = 0; x < classes.length; x++) {
      if (classes[x].selectorText === className) {
        result = {
          ...result,
          ...Array.from(classes[x].style).reduce((acc, prop) => {
            acc[prop] = classes[x].style[prop];
            return acc;
          }, {}),
          __CSS__: [...result.__CSS__, classes[x].cssText],
        };
      }
    }
    return result;
  }

  const list = Array.from(document.querySelectorAll('body'));

  return list
    .map((item) => {
      if (!item.classList.length) return null;
      return {
        composition: Array.from(item.classList).join(' '),
        style: Array.from(item.classList).reduce((acc, curr) => {
          return {
            ...acc,
            ...getStyle(`.${curr}`),
          };
        }, {}),
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
