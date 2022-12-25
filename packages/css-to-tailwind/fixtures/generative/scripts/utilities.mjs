import dlv from 'dlv';
import path from 'path';
import { promises as fs } from 'fs';
import pkg from 'tailwindcss/lib/corePlugins.js';
const { corePlugins } = pkg;

const defaultConfig = require('tailwindcss/resolveConfig')(
  require('tailwindcss/defaultConfig'),
);

// NOTE
// this script only runs with Bun

const data = Object.keys(corePlugins).reduce((acc, pluginName) => {
  let plugin = corePlugins[pluginName];

  const utilities = Object.keys(getUtilities(plugin))
    .map((key) => {
      if (key[0] !== '.') {
        throw new Error(`Key "${key}" is not a class`);
      }

      return key.slice(1);
    })
    .map((key) => key.split(' ')[0]) // nested selectors seems like leaking in here
    .map((key) => key.split('::')[0]) // same with pseudo-classes
    .sort();

  return {
    ...acc,
    [pluginName]: utilities,
  };
}, {});

await fs.writeFile(
  path.resolve(__dirname, '../utilities.json'),
  JSON.stringify(data, null, 2),
);

//////
//////
//////
//////

function normalizeProperties(input) {
  if (typeof input !== 'object') return input;
  if (Array.isArray(input)) return input.map(normalizeProperties);
  return Object.keys(input).reduce((newObj, key) => {
    let val = input[key];
    let newVal = typeof val === 'object' ? normalizeProperties(val) : val;
    newObj[
      key.replace(/([a-z])([A-Z])/g, (m, p1, p2) => `${p1}-${p2.toLowerCase()}`)
    ] = newVal;
    return newObj;
  }, {});
}

function getUtilities(plugin, { includeNegativeValues = false } = {}) {
  if (!plugin) return {};
  const utilities = {};

  function addUtilities(utils) {
    utils = Array.isArray(utils) ? utils : [utils];
    for (let i = 0; i < utils.length; i++) {
      for (let prop in utils[i]) {
        for (let p in utils[i][prop]) {
          if (p.startsWith('@defaults')) {
            delete utils[i][prop][p];
          }
        }
        utilities[prop] = normalizeProperties(utils[i][prop]);
      }
    }
  }

  plugin({
    addBase: () => {},
    addDefaults: () => {},
    addComponents: () => {},
    corePlugins: () => true,
    prefix: (x) => x,
    config: (option, defaultValue) => (option ? defaultValue : { future: {} }),
    addUtilities,
    theme: (key, defaultValue) => dlv(defaultConfig.theme, key, defaultValue),
    matchUtilities: (matches, { values, supportsNegativeValues } = {}) => {
      if (!values) return;

      let modifierValues = Object.entries(values);

      if (includeNegativeValues && supportsNegativeValues) {
        let negativeValues = [];
        for (let [key, value] of modifierValues) {
          let negatedValue =
            require('tailwindcss/lib/util/negateValue').default(value);
          if (negatedValue) {
            negativeValues.push([`-${key}`, negatedValue]);
          }
        }
        modifierValues.push(...negativeValues);
      }

      let result = Object.entries(matches).flatMap(
        ([name, utilityFunction]) => {
          return modifierValues
            .map(([modifier, value]) => {
              let declarations = utilityFunction(value, {
                includeRules(rules) {
                  addUtilities(rules);
                },
              });

              if (!declarations) {
                return null;
              }

              return {
                [require('tailwindcss/lib/util/nameClass').default(
                  name,
                  modifier,
                )]: declarations,
              };
            })
            .filter(Boolean);
        },
      );

      for (let obj of result) {
        for (let key in obj) {
          let deleteKey = false;
          for (let subkey in obj[key]) {
            if (subkey.startsWith('@defaults')) {
              delete obj[key][subkey];
              continue;
            }
            if (subkey.includes('&')) {
              result.push({
                [subkey.replace(/&/g, key)]: obj[key][subkey],
              });
              deleteKey = true;
            }
          }

          if (deleteKey) delete obj[key];
        }
      }

      addUtilities(result);
    },
  });
  return utilities;
}
