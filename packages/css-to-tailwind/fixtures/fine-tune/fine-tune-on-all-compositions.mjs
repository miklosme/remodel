import { promises as fs } from 'fs';

const files = (await fs.readdir('../compositions-resolved-direct-only')).filter(
  (file) => file.endsWith('.json'),
);
let data = await Promise.all(
  files.map(async (file) => {
    const content = await fs.readFile(
      `../compositions-resolved-direct-only/${file}`,
      'utf8',
    );
    return JSON.parse(content);
  }),
);

const getNoise = () => {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const length = Math.floor(Math.random() * 10) + 10;

  return Array.from({ length }, (_, index) => {
    if (index === 0) {
      return letters[Math.floor(Math.random() * letters.length)];
    }

    return chars[Math.floor(Math.random() * chars.length)];
  }).join('');
};

function styleDeclarationToCSS(style) {
  const noise = getNoise();
  return Object.entries(style)
    .map(([media, entries]) => {
      if (media === '') {
        return `.${noise} {
${Object.entries(entries)
  .map(([property, value]) => `  ${property}: ${value};`)
  .join('\n')}
        }`;
      }

      return `@media ${media} {
  .${noise}} {
${Object.entries(entries)
  .map(([property, value]) => `    ${property}: ${value};`)
  .join('\n')}
  }
}`;
    })
    .join('\n\n');
}

const filtered = data
  .flat()
  .map((item) => {
    const filterClasslist = item.classList.filter(
      (cl) => item.appliesRulesDirectly[cl],
    );

    if (filterClasslist.length === 0) {
      return null;
    }

    return {
      ...item,
      classList: filterClasslist,
    };
  })
  .filter(Boolean);

const processed = [];

for (const item of filtered) {
  const { classList, style, appliesRulesDirectly } = item;
  const completion = classList.join(' ');

  processed.push({
    prompt: styleDeclarationToCSS(style) + '\nTW:',
    completion: ` ${completion};`,
  });
}

// console.log(JSON.stringify(processed.slice(0, 100), null, 2));
console.log(JSON.stringify(processed, null, 2));
// console.log(processed.length);
