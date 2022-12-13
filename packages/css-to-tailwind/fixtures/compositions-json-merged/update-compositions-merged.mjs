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

function getParsedValues() {
  const knownComponents = new Set();
  const isCompositionKnown = (classList) => {
    const composition = Array.from(classList).sort().join(' ');
    if (knownComponents.has(composition)) return true;
    return false;
  };
  const markCompositionAsKnown = (classList) => {
    const composition = Array.from(classList).sort().join(' ');
    knownComponents.add(composition);
  };
  const isMatching = (el, selector) => {
    const root = document.querySelector(':root');
    if (root && root.matches(selector) && root !== el) return false;
    return el.matches(selector);
  };
  function findRule(className, callback) {
    const el = document.createElement('div');
    el.classList.add(className);

    for (const sheet of document.styleSheets) {
      try {
        sheet.cssRules;
      } catch (e) {
        continue;
      }
      for (const rule of sheet.rules) {
        if (rule.media) {
          for (const mediaRule of rule.cssRules) {
            if (isMatching(el, mediaRule.selectorText)) {
              callback(mediaRule, rule.media.mediaText);
            }
          }
        } else if (isMatching(el, rule.selectorText)) {
          callback(rule, null);
        }
      }
    }
  }

  function getStyle(el) {
    const style = {};
    const css = [];

    Array.from(el.classList).forEach((className) => {
      findRule(className, (rule, mediaText) => {
        if (mediaText) {
          css.push(`@media ${mediaText} { ${rule.cssText} }`);

          for (const property of rule.style) {
            style[mediaText] = style[mediaText] || {};
            style[mediaText][property] = rule.style[property];
          }
        } else {
          css.push(rule.cssText);

          for (const property of rule.style) {
            style[''] = style[''] || {};
            style[''][property] = rule.style[property];
          }
        }
      });
    });

    return { style, css };
  }

  const list = Array.from(
    // document.querySelectorAll('.flex.items-center.md\\:gap-x-12'),
    document.querySelectorAll('*'),
  );

  return list
    .map((item) => {
      if (!item.classList.length) return null;
      if (isCompositionKnown(item.classList)) return null;
      markCompositionAsKnown(item.classList);

      return {
        tag: item.tagName.toLowerCase(),
        classList: Array.from(item.classList).sort(),
        ...getStyle(item),
      };
    })
    .filter(Boolean);
}

const browser = await chromium.launch();
const context = await browser.newContext(devices['Desktop Chrome HiDPI']);
const page = await context.newPage();

const tasks = urls.map((url) => async () => {
  console.log('Processing:', url);
  await page.goto(url);
  const result = await page.evaluate(getParsedValues);

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
