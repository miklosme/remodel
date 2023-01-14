import parseCSS from 'postcss-safe-parser';
import postcssValueParser from 'postcss-value-parser';
import resolveConfig from 'tailwindcss/resolveConfig.js';
import parseUnit from 'parse-unit';

function getResolvedTaiwindConfig() {
  return resolveConfig({
    content: ['./src/**/*.{js,ts,jsx,tsx}'],
    theme: {
      extend: {},
    },
    plugins: [],
  });
}

const defaultOptions = {
  COLOR_DELTA: 2,
  FULL_ROUND: 9999,
  REM: 16,
  EM: 16,
  PREPROCESSOR_INPUT:
    '@tailwind base;\n\n@tailwind components;\n\n@tailwind utilities;',
  TAILWIND_CONFIG: null,
};

function parseSize(val) {
  if (val === '0') {
    val = '0px';
  }

  let [value, unit] = parseUnit(val);

  unit = unit.trim();

  switch (unit) {
    case 'px':
      return { value, unit, normalized: value, original: val };
    case 'rem':
      return {
        value,
        unit,
        normalized: value * defaultOptions.REM,
        original: val,
      };
    case 'em':
      return {
        value,
        unit,
        normalized: value * defaultOptions.EM,
        original: val,
      };
    default:
      throw new Error(`Unknown unit: "${unit}"`);
  }
}

function parseTime(val) {
  if (val === '0') {
    val = '0s';
  }

  let [value, unit] = parseUnit(val);

  unit = unit.trim();

  switch (unit) {
    case 'ms':
      return { value, unit, normalized: value, original: val };
    case 's':
      return {
        value,
        unit,
        normalized: value * 1000,
        original: val,
      };
    default:
      throw new Error(`Unknown unit: "${unit}"`);
  }
}

function parseColor(hex) {
  if (!hex.startsWith('#')) {
    throw new Error(`parseColor only accepts hex values, got: "${hex}"`);
  }

  let color = hex.replace('#', '');
  if (color.length === 3) {
    color = color
      .split('')
      .map((char) => char + char)
      .join('');
  }

  const r = (color >> 16) & 255;
  const g = (color >> 8) & 255;
  const b = color & 255;

  return {
    int: parseInt(color, 16),
    rgb: [r, g, b],
    original: hex,
  };
}

function getSizeBreakPoints(data) {
  return Object.values(data)
    .map((val) => {
      // values with extra data are arrays
      // for example: [ '0.875rem', { lineHeight: '1.25rem' } ],
      if (Array.isArray(val)) {
        val = val[0];
      }

      try {
        return parseSize(val);
      } catch (e) {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, z) => a.normalized - z.normalized);
}

function getColorBreakPoints(data) {
  let colors = [];

  Object.values(data).forEach((val) => {
    if (typeof val === 'string' && val.startsWith('#')) {
      colors.push(val);
    } else if (typeof val === 'object' && val !== null) {
      Object.values(val).forEach((val) => {
        if (typeof val === 'string' && val.startsWith('#')) {
          colors.push(val);
        }
      });
    }
  });

  colors = colors.map(parseColor).sort((a, z) => a.int - z.int);

  return colors;
}

function snapSizeToBreakpoint(value, breakPoints) {
  try {
    const { normalized } = parseSize(value);
    const closestBreakPoint = breakPoints.reduce((acc, curr) => {
      if (
        Math.abs(curr.normalized - normalized) <
        Math.abs(acc.normalized - normalized)
      ) {
        return curr;
      } else {
        return acc;
      }
    });

    return closestBreakPoint.original;
  } catch (e) {
    return value;
  }
}

function snapColorToBreakpoint(value, breakPoints) {
  try {
    const { int, rgb } = parseColor(value);
    const closestBreakPoint = breakPoints.reduce((acc, curr) => {
      if (Math.abs(curr.int - int) < Math.abs(acc.int - int)) {
        return curr;
      } else {
        return acc;
      }
    });

    return closestBreakPoint.original;
  } catch (e) {
    return value;
  }
}

export function normalizeCSSValues(css) {
  const { theme } = getResolvedTaiwindConfig();

  const colorPropsToSnap = [
    {
      props: ['color'],
      breakPoints: getColorBreakPoints(theme.textColor),
    },
    {
      props: ['fill'],
      breakPoints: getColorBreakPoints(theme.fill),
    },
    {
      props: ['stroke'],
      breakPoints: getColorBreakPoints(theme.stroke),
    },
    {
      props: ['background', 'background-color'],
      breakPoints: getColorBreakPoints(theme.backgroundColor),
    },
    {
      props: [
        'border',
        'border-color',
        'border-top-color',
        'border-right-color',
        'border-bottom-color',
        'border-left-color',
      ],
      breakPoints: getColorBreakPoints(theme.borderColor),
    },
  ];

  const noColorBreakpoints = colorPropsToSnap.some(
    (prop) => prop.breakPoints.length === 0,
  );
  if (noColorBreakpoints) {
    console.log(noColorBreakpoints);
    throw new Error('No colors found in tailwind config');
  }

  const sizePropsToSnap = [
    {
      props: [
        'padding',
        'padding-right',
        'padding-bottom',
        'padding-left',
        'padding-top',
      ],
      breakPoints: getSizeBreakPoints(theme.padding),
    },
    {
      props: [
        'margin',
        'margin-right',
        'margin-bottom',
        'margin-left',
        'margin-top',
      ],
      breakPoints: getSizeBreakPoints(theme.margin),
    },
    {
      props: ['width', 'min-width', 'max-width'],
      breakPoints: getSizeBreakPoints(theme.width),
    },
    {
      props: ['height', 'min-height', 'max-height'],
      breakPoints: getSizeBreakPoints(theme.height),
    },
    {
      props: ['font-size'],
      breakPoints: getSizeBreakPoints(theme.fontSize),
    },
    {
      props: [
        'border',
        'border-width',
        'border-top-width',
        'border-right-width',
        'border-bottom-width',
        'border-left-width',
      ],
      breakPoints: getSizeBreakPoints(theme.borderWidth),
    },
    // {
    // TODO: handle full rounding 9999px
    //   props: ['border-radius'],
    //   breakPoints: getSizeBreakPoints(theme.borderRadius),
    // },
    {
      props: ['line-height'],
      breakPoints: getSizeBreakPoints(theme.lineHeight),
    },
    {
      props: ['letter-spacing'],
      breakPoints: getSizeBreakPoints(theme.letterSpacing),
    },
    {
      props: ['gap', 'row-gap', 'column-gap'],
      breakPoints: getSizeBreakPoints(theme.gap),
    },
    {
      props: [
        'scroll-padding',
        'scroll-padding-right',
        'scroll-padding-bottom',
        'scroll-padding-left',
        'scroll-padding-top',
      ],
      breakPoints: getSizeBreakPoints(theme.scrollPadding),
    },
    {
      props: [
        'scroll-margin',
        'scroll-margin-right',
        'scroll-margin-bottom',
        'scroll-margin-left',
        'scroll-margin-top',
      ],
      breakPoints: getSizeBreakPoints(theme.scrollMargin),
    },
    {
      props: ['flex-basis'],
      breakPoints: getSizeBreakPoints(theme.flexBasis),
    },
    {
      props: ['top', 'right', 'bottom', 'left'],
      breakPoints: getSizeBreakPoints(theme.inset),
    },
    {
      props: ['text-decoration-thickness'],
      breakPoints: getSizeBreakPoints(theme.textDecorationThickness),
    },
    {
      props: ['outline-width'],
      breakPoints: getSizeBreakPoints(theme.outlineWidth),
    },
    {
      props: ['outline-offset'],
      breakPoints: getSizeBreakPoints(theme.outlineOffset),
    },
    {
      props: ['text-indent'],
      breakPoints: getSizeBreakPoints(theme.textIndent),
    },
    // {
    //   props: ['transition-duration'],
    //   breakPoints: getSizeBreakPoints(theme.transitionDuration),
    // },
  ];

  const noSizeBreakpoints = sizePropsToSnap.find(
    (item) => item.breakPoints.length === 0,
  );
  if (noSizeBreakpoints) {
    console.log(noSizeBreakpoints);
    throw new Error('No size breakpoints found');
  }

  const ast = parseCSS(css);

  ast.walkDecls((decl) => {
    const sizeBreakPoints = sizePropsToSnap.find((item) => {
      return item.props.includes(decl.prop);
    })?.breakPoints;
    const colorBreakPoints = colorPropsToSnap.find((item) => {
      return item.props.includes(decl.prop);
    })?.breakPoints;

    if (sizeBreakPoints || colorBreakPoints) {
      const valueAst = postcssValueParser(decl.value);
      valueAst.walk((node) => {
        if (sizeBreakPoints) {
          if (node.type === 'word') {
            node.value = snapSizeToBreakpoint(node.value, sizeBreakPoints);
            node.value = snapColorToBreakpoint(node.value, colorBreakPoints);
          }
        }
      });
      decl.value = valueAst.toString().trim();
    }
  });

  return ast.toString();
}
