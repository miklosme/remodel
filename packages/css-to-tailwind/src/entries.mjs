import parseCSS from 'postcss-safe-parser';

export function entriesFromCSS(css) {
  const ast = parseCSS(css);
  const results = [];
  ast.walkDecls((decl) => {
    results.push({
      prop: decl.prop,
      value: decl.value,
    });
  });
  return results;
}
