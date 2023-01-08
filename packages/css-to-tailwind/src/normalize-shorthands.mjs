import { CSSStyleDeclaration } from 'cssstyle/lib/CSSStyleDeclaration.js';
import postcss from 'postcss';
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

export async function normalizeCSSShorthands(css) {
  const normalize = {
    postcssPlugin: 'normalize-shorthands',
    Once(root) {
      root.walkDecls((decl) => {
        const normalized = normalizeShorthands(decl.prop, decl.value);
        normalized.forEach(([prop, value]) => {
          decl.cloneBefore({ prop, value });
        });
        decl.remove();
      });
    },
  };

  const { css: normalizedCSS } = await postcss([normalize]).process(css, {
    parser: parseCSS,
    from: undefined,
  });

  return normalizedCSS;
}

export function normalizeCSSShorthandsSync(css) {
  const ast = parseCSS(css);
  ast.walkDecls((decl) => {
    const normalized = normalizeShorthands(decl.prop, decl.value);
    normalized.forEach(([prop, value]) => {
      decl.cloneBefore({ prop, value });
    });
    decl.remove();
  });
  return ast.toString();
}
