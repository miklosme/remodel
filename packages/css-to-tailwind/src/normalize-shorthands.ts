import { CSSStyleDeclaration } from 'cssstyle/lib/CSSStyleDeclaration.js';

export function normalizeShorthands(touples) {
  const declaration = new CSSStyleDeclaration();

  touples.forEach(([prop, value]) => {
    declaration.setProperty(prop, value);
  });

  return Object.entries(declaration.getNonShorthandValues());
}
