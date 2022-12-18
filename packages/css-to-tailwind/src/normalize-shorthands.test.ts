import { test, expect } from 'vitest';
import { normalizeShorthands } from './normalize-shorthands';

test.only('normalize-shorthands', () => {
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
