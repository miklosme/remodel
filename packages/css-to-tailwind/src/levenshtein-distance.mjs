import { tokenizeUtility } from './utils.mjs';

export function levenshteinDistance(a, b) {
  // Create empty edit distance matrix for all possible modifications of
  // substrings of a to substrings of b.
  const distanceMatrix = Array(b.length + 1)
    .fill(null)
    .map(() => Array(a.length + 1).fill(null));

  // Fill the first row of the matrix.
  // If this is first row then we're transforming empty string to a.
  // In this case the number of transformations equals to size of a substring.
  for (let i = 0; i <= a.length; i += 1) {
    distanceMatrix[0][i] = i;
  }

  // Fill the first column of the matrix.
  // If this is first column then we're transforming empty string to b.
  // In this case the number of transformations equals to size of b substring.
  for (let j = 0; j <= b.length; j += 1) {
    distanceMatrix[j][0] = j;
  }

  for (let j = 1; j <= b.length; j += 1) {
    for (let i = 1; i <= a.length; i += 1) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      distanceMatrix[j][i] = Math.min(
        distanceMatrix[j][i - 1] + 1, // deletion
        distanceMatrix[j - 1][i] + 1, // insertion
        distanceMatrix[j - 1][i - 1] + indicator, // substitution
      );
    }
  }

  return distanceMatrix[b.length][a.length];
}

export function findClosestMatch(halucination, utilities) {
  const tokenDistances = {};
  let closestTokenDistance = null;
  for (const utility of utilities) {
    const distance = levenshteinDistance(
      tokenizeUtility(halucination),
      tokenizeUtility(utility),
    );
    if (distance <= 4) {
      tokenDistances[utility] = distance;
      if (closestTokenDistance === null || distance < closestTokenDistance) {
        closestTokenDistance = distance;
      }
    }
  }

  if (closestTokenDistance === null) {
    return {
      closestTokenDistance: null,
      guesses: [],
      topGuess: null,
      halucination,
    };
  }

  const guesses = Object.entries(tokenDistances)
    .filter(([, distance]) => distance === closestTokenDistance)
    .map(([utility]) => utility);
  const charDistances = {};
  let closestCharDistance = null;
  let topGuess = null;
  for (const candidate of guesses) {
    const distance = levenshteinDistance(halucination, candidate);
    charDistances[candidate] = distance;
    if (closestCharDistance === null || distance < closestCharDistance) {
      closestCharDistance = distance;
      topGuess = candidate;
    }
  }

  return {
    closestTokenDistance,
    guesses,
    topGuess,
    halucination,
  };
}
