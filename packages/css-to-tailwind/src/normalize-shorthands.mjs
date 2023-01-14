import { CSSStyleDeclaration } from 'cssstyle/lib/CSSStyleDeclaration.js';
import parseCSS from 'postcss-safe-parser';

export function normalizeShorthands(prop, value) {
  const declaration = new CSSStyleDeclaration();

  declaration.setProperty(prop, value);

  const result = Object.entries(declaration.getNonShorthandValues());

  if (result.length === 0) {
    // this is likely a bug in the CSSStyleDeclaration implementation
    return [[prop, value]];
  }

  return result;
}

export function removeComments(css) {
  const ast = parseCSS(css);
  ast.walkDecls((decl) => {
    if (decl.prop === '//') {
      decl.remove();
    }
  });
  return ast.toString();
}

export function normalizeCSSShorthands(css) {
  const ast = parseCSS(removeComments(css));
  ast.walkDecls((decl) => {
    const normalized = normalizeShorthands(decl.prop, decl.value);
    normalized.forEach(([prop, value]) => {
      decl.cloneBefore({ prop, value });
    });
    decl.remove();
  });
  return ast.toString();
}
