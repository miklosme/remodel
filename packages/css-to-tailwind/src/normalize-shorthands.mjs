import { CSSStyleDeclaration } from 'cssstyle/lib/CSSStyleDeclaration.js';
import postcss from 'postcss';
import parseCSS from 'postcss-safe-parser';

export function normalizeShorthands(touples) {
  const declaration = new CSSStyleDeclaration();

  touples.forEach(([prop, value]) => {
    declaration.setProperty(prop, value);
  });

  return Object.entries(declaration.getNonShorthandValues());
}

export async function normalizeCSSShorthands(css) {
  const normalize = {
    postcssPlugin: 'normalize-shorthands',
    Once(root) {
      root.walkDecls((decl) => {
        const normalized = normalizeShorthands([[decl.prop, decl.value]]);
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
    const normalized = normalizeShorthands([[decl.prop, decl.value]]);
    normalized.forEach(([prop, value]) => {
      decl.cloneBefore({ prop, value });
    });
    decl.remove();
  });
  return ast.toString();
}
