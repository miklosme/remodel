import { test, expect } from 'vitest';
import {
  removeComments,
  normalizeShorthands,
  normalizeCSSShorthands,
} from './normalize-shorthands';

test('removeComments', () => {
  const css = `

/* this is a comment */
.selector {
  // margin: 2rem 17px;
  transition-duration: 501ms;
  color: red; // this is a comment
}

  `.trim();

  const result = removeComments(css);

  expect(result).toBe(
    `
.selector {
  transition-duration: 501ms;
  color: red;
}
`.trim(),
  );
});

test('normalize-shorthands', () => {
  const touples = [
    ['margin', '1rem'],
    ['border', '1px solid red'],
    ['padding', '1rem 2rem 3rem 4rem'],
    ['background', 'url("http://example.com/image.png")'],
  ];

  const result = normalizeShorthands(touples);

  function getPropertyValue(name, touples) {
    const found = touples.find(([prop]) => prop === name);
    return found ? found[1] : undefined;
  }

  expect(getPropertyValue('margin-top', result)).toBe('1rem');
  expect(getPropertyValue('margin-right', result)).toBe('1rem');
  expect(getPropertyValue('margin-bottom', result)).toBe('1rem');
  expect(getPropertyValue('margin-left', result)).toBe('1rem');
  expect(getPropertyValue('border-top-width', result)).toBe('1px');
  expect(getPropertyValue('border-right-width', result)).toBe('1px');
  expect(getPropertyValue('border-bottom-width', result)).toBe('1px');
  expect(getPropertyValue('border-left-width', result)).toBe('1px');
  expect(getPropertyValue('border-top-style', result)).toBe('solid');
  expect(getPropertyValue('border-right-style', result)).toBe('solid');
  expect(getPropertyValue('border-bottom-style', result)).toBe('solid');
  expect(getPropertyValue('border-left-style', result)).toBe('solid');
  expect(getPropertyValue('border-top-color', result)).toBe('red');
  expect(getPropertyValue('border-right-color', result)).toBe('red');
  expect(getPropertyValue('border-bottom-color', result)).toBe('red');
  expect(getPropertyValue('border-left-color', result)).toBe('red');
  expect(getPropertyValue('padding-top', result)).toBe('1rem');
  expect(getPropertyValue('padding-right', result)).toBe('2rem');
  expect(getPropertyValue('padding-bottom', result)).toBe('3rem');
  expect(getPropertyValue('padding-left', result)).toBe('4rem');
  expect(getPropertyValue('background-image', result)).toBe(
    'url(http://example.com/image.png)',
  );

  // should not contain shorthands
  expect(getPropertyValue('margin', result)).toBeUndefined();
  expect(getPropertyValue('border', result)).toBeUndefined();
  expect(getPropertyValue('padding', result)).toBeUndefined();
  expect(getPropertyValue('background', result)).toBeUndefined();
});

test('normalizeCSSShorthands', () => {
  const css = `
.foobar {
  margin: 1rem;
  border-left: 1px solid red;
  padding: 1rem 2rem 3rem 4rem;
  background: url("http://example.com/image.png");
}

@media (min-width: 640px) {
  .foobar {
    margin: 4rem;
  }
}
`;

  const result = normalizeCSSShorthands(css);

  expect(result).toBe(`
.foobar {
  margin-top: 1rem;
  margin-right: 1rem;
  margin-bottom: 1rem;
  margin-left: 1rem;
  border-left-width: 1px;
  border-left-style: solid;
  border-left-color: red;
  padding-top: 1rem;
  padding-right: 2rem;
  padding-bottom: 3rem;
  padding-left: 4rem;
  background-image: url(http://example.com/image.png);
}

@media (min-width: 640px) {
  .foobar {
    margin-top: 4rem;
    margin-right: 4rem;
    margin-bottom: 4rem;
    margin-left: 4rem;
  }
}
`);
});
