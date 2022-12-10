# Fixtures for testing

## Update the core utilities

Run `update-core-utilities.mjs` with `bun`. It will overwrite the `core.utilities.txt` file.

## Scrape from source files

This script won't run with `Bun v0.2.2`.

```shell
node fixtures/update-scraped-utilities.mjs ../../../tailwindui/tailwindui-salient/src/{pages,components}/**/* > fixtures/salient.utilities.txt
```

Running it on multiple projects at once:

```shell
for NAME in {salient,spotlight,keynote,pocket,primer,syntax,transmit}; do
  node fixtures/update-scraped-utilities.mjs ../../../tailwindui/tailwindui-$NAME/src/{pages,components}/**/*.jsx > fixtures/$NAME.utilities.txt;
done
```

## Scrape classes from a website

Run the followign code in the browser's console:

```js
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

copy(getAllClassList().join('\n'));
```
