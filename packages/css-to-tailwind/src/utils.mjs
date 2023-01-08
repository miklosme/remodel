const knownValues = new Set([
  'auto',
  'fit',
  'full',
  'max',
  'min',
  'px',
  'screen',
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
  '3xl',
  'none',
  'full',
]);

export function tokenizeUtility(str) {
  return str.split('-').map((token, index) => {
    if (index === 0) {
      // make sure it never hides the very first token
      return token;
    }

    if (knownValues.has(token)) {
      return '$';
    }

    // if the token is a number, replace it with a $ sign
    // number tokens can contain a double escaped dot
    if (token.match(/^[0-9\/\.\\]+$/)) {
      return '$';
    }

    return token;
  });
}
