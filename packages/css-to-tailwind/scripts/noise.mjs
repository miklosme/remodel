import parseCSS from 'postcss-safe-parser';

function choose(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function range(start, step, end) {
  if (typeof end === 'undefined') {
    end = step;
    step = 1;
  }

  const result = [];
  for (let i = start; i <= end; i += step) {
    result.push(i);
  }
  return result;
}

export function addNoiseToCSS(css) {
  const ast = parseCSS(css);
  ast.walkDecls((decl) => {
    // add noise to size values
    decl.value = decl.value.replace(
      /(\d+\.?\d*(rem|px))/g,
      (match, float, measure) => {
        const number = parseFloat(float);

        if (typeof number !== 'number') {
          return float;
        }

        // ideally after normalization it will return to the original value
        // because we want to validate the transformation later
        // so let's use tiny values
        const noise = choose(range(-0.05, 0.01, 0.05));
        const newNumber = number + noise;
        return `${newNumber}${measure} /* ${float} */`;
      },
    );

    // add noise to color values
    decl.value = decl.value.replace(
      /#([0-9a-f]{6}|[0-9a-f]{3})/gi,
      (match, hex) => {
        if (hex.length === 3) {
          hex = hex
            .split('')
            .map((char) => char + char)
            .join('');
        }

        const number = parseInt(hex, 16);

        if (typeof number !== 'number') {
          return hex;
        }

        const r = (number >> 16) & 255;
        const g = (number >> 8) & 255;
        const b = number & 255;

        // ideally after normalization it should return to the original value
        // because we want to validate the transformation later
        // so let's use tiny values
        const newR = Math.floor(
          Math.max(0, Math.min(255, r + choose(range(-1, 0.1, 1)))),
        );
        const newG = Math.floor(
          Math.max(0, Math.min(255, g + choose(range(-1, 0.1, 1)))),
        );
        const newB = Math.floor(
          Math.max(0, Math.min(255, b + choose(range(-1, 0.1, 1)))),
        );

        const stringR = newR.toString(16).padStart(2, '0');
        const stringG = newG.toString(16).padStart(2, '0');
        const stringB = newB.toString(16).padStart(2, '0');

        const newHex = `#${stringR}${stringG}${stringB}`;

        const distance = Math.sqrt(
          Math.pow(r - newR, 2) + Math.pow(g - newG, 2) + Math.pow(b - newB, 2),
        ).toFixed(2);

        return `${newHex} /* distance: ${distance} */`;
      },
    );
  });
  return ast.toString();
}
