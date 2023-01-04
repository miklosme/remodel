export function tokenizeUtility(str) {
  return str.split('-').map((token) => {
    // if the token is a number, replace it with a $ sign
    // number tokens can contain a double escaped dot
    if (token.match(/^[0-9\/\.\\]+$/)) {
      return '$';
    }

    return token;
  });
}
