import parseCSS from 'postcss-safe-parser';

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
