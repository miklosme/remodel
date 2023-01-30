export function findBestFit(dictionary, target) {
  let min = Number.MAX_SAFE_INTEGER;
  let result = [];

  function backtrack(current, index) {
    const covered = new Set(current.flat());

    if (covered.size === target.length) {
      if (target.every((item) => covered.has(item))) {
        if (current.length < min) {
          min = current.length;
          result = current;
        }

        return;
      }
    }

    for (let i = index; i < dictionary.length; i++) {
      backtrack([...current, dictionary[i]], i + 1);

      // the `min` variable might decreased in the recursion call above
      // if so, we can stop the loop early

      if (current.length + 1 >= min) {
        break;
      }
    }
  }

  backtrack([], 0);

  return result;
}
