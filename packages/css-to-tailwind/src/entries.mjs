import parseCSS from 'postcss-safe-parser';
import prettier from 'prettier';

export function entriesFromCSS(css) {
  const ast = parseCSS(css);
  const results = [];
  ast.walkDecls((decl) => {
    results.push({
      property: decl.prop,
      value: decl.value,
    });
  });
  return results;
}

export function entriesToCSS(selector, entries) {
  const declarations = entries.map(
    ({ property, value }) => `${property}: ${value};`,
  );
  const css = `${selector} { ${declarations.join(' ')} }`;

  return prettier.format(css, { parser: 'css' });
}
