import prettier from 'prettier';

export function getCompactCSS(css) {
  return (
    '\n' +
    prettier
      .format(css, { parser: 'css' })
      .replace(/([;{])\n/gm, '$1 ')
      .replace(/[ ]+/g, ' ')
  );
}

const knownValues = new Set([
  'auto',
  'fit',
  'full',
  'max',
  'min',
  'px',
  'screen',
  'xs3',
  'xs2',
  'xs',
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
  '3xl',
  '4xl',
  '5xl',
  '6xl',
  '7xl',
  'none',
  'full',
]);

export function tokenizeUtility(str) {
  let isValueTokenFound = false;
  return str
    .split('-')
    .reverse()
    .map((token, index, { lenght }) => {
      if (isValueTokenFound) {
        return token;
      }

      if (index === lenght - 1) {
        // make sure it never hides the very first token
        return token;
      }

      if (token === '$') {
        isValueTokenFound = true;
        return '$';
      }

      if (knownValues.has(token)) {
        isValueTokenFound = true;
        return '$';
      }

      // if the token is a number, replace it with a $ sign
      // number tokens can contain a double escaped dot
      if (token.match(/^[0-9\/\.\\]+$/)) {
        isValueTokenFound = true;
        return '$';
      }

      return token;
    })
    .reverse();
}
