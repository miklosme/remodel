# Fixtures for testing

## Update the core utilities

Run `update-core-utilities.mjs` with `bun`. It will overwrite the `core.utilities.txt` file.

## Scrape from source files

```shell
bun fixtures/update-scraped-utilities.mjs ../../../tailwindui/tailwindui-salient/src/{pages,components}/**/* > fixtures/salient.utilities.txt
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
