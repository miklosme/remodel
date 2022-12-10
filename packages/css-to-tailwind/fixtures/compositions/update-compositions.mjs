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

function getAllClassList() {
  const list = Array.from(document.querySelectorAll('*'))
    .map((el) => {
      return el.classList.length ? Array.from(el.classList).join(' ') : null;
    })
    .filter(Boolean);

  return Array.from(new Set(list));
}

// Setup
const browser = await chromium.launch();
const context = await browser.newContext(devices['Desktop Chrome HiDPI']);
const page = await context.newPage();

const tasks = urls.map((url) => async () => {
  console.log('Processing:', url);
  await page.goto(url);
  const classList = await page.evaluate(getAllClassList);
  const data = classList.sort((a, b) => a.length - b.length).join('\n');

  const file = `${url.replace(
    /https:\/\/|\.tailwindui\.com\//g,
    '',
  )}.compositions.txt`;
  await fs.writeFile(path.resolve(__dirname, file), data, 'utf8');
  console.log('Done:', url);
});

for (const task of tasks) {
  await task();
}

// Teardown
await context.close();
await browser.close();
