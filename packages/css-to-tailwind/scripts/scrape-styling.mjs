function getAllClassList() {
  const list = Array.from(document.querySelectorAll('*'))
    .map((el) => {
      return el.classList.length
        ? Array.from(el.classList).sort().join(' ')
        : null;
    })
    .filter(Boolean);

  return Array.from(new Set(list)).sort();
}

function getRules() {
  const rules = Array.from(document.styleSheets[0].rules)
    .map((rule) => ({
      selector: rule.selectorText,
      styleMap: rule.styleMap,
    }))
    .filter((rule) => rule.selector && rule.styleMap);

  const parsed = rules.map((rule) => {
    const style = Array.from(rule.styleMap)
      .map(([prop, val]) => [prop, val].join(': '))
      .join(';\n');

    return {
      selector: rule.selector,
      style,
    };
  });

  return parsed;
}
