import crypto from 'crypto';
import prettier from 'prettier';

export function hashCSS(css) {
  const formatted = prettier
    .format(css, { parser: 'css', printWidth: 100 })
    .trim();
  const hash = crypto
    .createHash('shake256', { outputLength: 4 })
    .update(formatted)
    .digest('hex');

  return `css-${hash}-${formatted.length}`;
}

export function hashClassList(classList) {
  const formatted = classList.sort().join(' ').trim();
  const hash = crypto
    .createHash('shake256', { outputLength: 4 })
    .update(formatted)
    .digest('hex');

  return `classList-${hash}-${formatted.length}`;
}
