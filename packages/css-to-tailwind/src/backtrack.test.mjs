import { test, expect } from 'vitest';
import { findBestFit } from './find-best-fit.mjs';

test('findBestFit', () => {
  // prettier-ignore
  const dictionary = [
    ['1'],
    ['2'],
    ['3'],
    ['2', '3'],
    ['4'],
    ['5'],
    ['6'],
  ];
  const target = ['1', '2', '3'];

  const result = findBestFit(dictionary, target);

  expect(result).toEqual([['1'], ['2', '3']]);
});
