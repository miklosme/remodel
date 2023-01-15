import { normalizeCSSShorthands } from '../src/normalize-shorthands.mjs';
import { roundCSSValues } from '../src/round.mjs';
import { entriesFromCSS } from '../src/entries.mjs';

export function normalize(css) {
  const normalized = normalizeCSSShorthands(css);
  const normalizedValues = roundCSSValues(normalized);
  const entries = entriesFromCSS(normalizedValues);

  return entries;
}
