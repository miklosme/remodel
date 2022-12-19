import cssToTailwind from '../src/index.mjs';
import dotenv from 'dotenv';

dotenv.config();

const queue = [];

function test(name, fn) {
  queue.push({ name, fn });
}

test.only = (name, fn) => {
  queue.push({ name, fn, only: true });
};

function expect(received) {
  return {
    toMatchTailwindClasses(argument) {
      let classesRecived = Array.from(new Set(received)).sort().join(' ');
      let classesExpected = Array.from(
        new Set(argument.split(' ').filter(Boolean)),
      )
        .sort()
        .join(' ');

      const pass = classesRecived === classesExpected;

      if (!pass) {
        throw new Error(
          `Recived: ${classesRecived}\nExpected: ${classesExpected}`,
        );
      }
    },
  };
}

const leftPad = (str, len = 2) => {
  const padded = str
    .split('\n')
    .map((line) => ' '.repeat(len) + line)
    .join('\n');

  return `\n${padded}\n`;
};

test('css-to-tailwind: simple-001 (id: 0a3f64)', async () => {
  // ID: 0a3f64

  const tailwindResult = await cssToTailwind(`
.selector {
  padding-top: 1rem;
  padding-right: 1rem;
  padding-bottom: 1rem;
  padding-left: 1rem;
}
`);

  expect(tailwindResult.classes).toMatchTailwindClasses('p-4');
});

test('css-to-tailwind: simple-002 (id: 7291c9)', async () => {
  // ID: 7291c9

  const tailwindResult = await cssToTailwind(`
.selector {
  margin-left: 1rem;
  margin-top: 2rem;
}
`);

  expect(tailwindResult.classes).toMatchTailwindClasses('ml-4 mt-8');
});

test('css-to-tailwind: simple-003 (id: 7291c9)', async () => {
  // ID: 7291c9

  const tailwindResult = await cssToTailwind(`
.selector {
  margin-left: 1rem;
}
`);

  expect(tailwindResult.classes).toMatchTailwindClasses('ml-4');
});

test('css-to-tailwind: simple-004 (id: 57decf)', async () => {
  // ID: 57decf

  const tailwindResult = await cssToTailwind(`
.selector {
  margin-left: 0.75rem;
}
`);

  expect(tailwindResult.classes).toMatchTailwindClasses('ml-3');
});

test('css-to-tailwind: simple-005 (id: 7291c9)', async () => {
  // ID: 7291c9

  const tailwindResult = await cssToTailwind(`
.selector {
  margin-left: 1rem;
}
`);

  expect(tailwindResult.classes).toMatchTailwindClasses('ml-4');
});

test('css-to-tailwind: simple-006 (id: 57decf)', async () => {
  // ID: 57decf

  const tailwindResult = await cssToTailwind(`
.selector {
  margin-left: 0.75rem;
}
`);

  expect(tailwindResult.classes).toMatchTailwindClasses('ml-3');
});

test('css-to-tailwind: simple-007 (id: 1476ae)', async () => {
  // ID: 1476ae

  const tailwindResult = await cssToTailwind(`
.selector {
  margin-top: 8rem;
}
`);

  expect(tailwindResult.classes).toMatchTailwindClasses('mt-32');
});

test('css-to-tailwind: simple-008 (id: 4a8f75)', async () => {
  // ID: 4a8f75

  const tailwindResult = await cssToTailwind(`
.selector {
  fill: rgb(165, 180, 252);
}
`);

  expect(tailwindResult.classes).toMatchTailwindClasses('fill-indigo-300');
});

test('css-to-tailwind: simple-009 (id: 57decf)', async () => {
  // ID: 57decf

  const tailwindResult = await cssToTailwind(`
.selector {
  margin-left: 0.75rem;
}
`);

  expect(tailwindResult.classes).toMatchTailwindClasses('ml-3');
});

test('css-to-tailwind: advanced-001 (id: e76982)', async () => {
  // ID: e76982

  const tailwindResult = await cssToTailwind(`
.selector {
  text-align: center;
  font-size: 0.875rem;
  line-height: 1.5rem;
  font-weight: 600;
  color: rgb(23 23 23 / var(--tw-text-opacity));
}

@media (min-width: 1024px) {
  .selector {
    text-align: left;
  }
}
`);

  expect(tailwindResult.classes).toMatchTailwindClasses(
    'font-semibold lg:text-left text-center text-gray-900 text-sm',
  );
});

test('css-to-tailwind: advanced-002 (id: d28ad9)', async () => {
  // ID: d28ad9

  const tailwindResult = await cssToTailwind(`
.selector {
  margin-top: 1.5rem;
  font-size: 0.875rem;
  line-height: 1.5rem;
  color: rgb(115 115 115 / var(--tw-text-opacity));
}

@media (min-width: 768px) {
  .selector {
    margin-top: 0px;
  }
}
`);

  expect(tailwindResult.classes).toMatchTailwindClasses(
    'md:mt-0 mt-6 text-gray-500 text-sm',
  );
});

test('css-to-tailwind: advanced-003 (id: 85a90d)', async () => {
  // ID: 85a90d

  const tailwindResult = await cssToTailwind(`
.selector {
  margin-left: auto;
  margin-right: auto;
  margin-top: 4rem;
  max-width: 64rem;
}

@media (min-width: 1024px) {
  .selector {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
}
`);

  expect(tailwindResult.classes).toMatchTailwindClasses(
    'lg:px-6 max-w-5xl mt-16 mx-auto',
  );
});

test('css-to-tailwind: advanced-004 (id: fdd464)', async () => {
  // ID: fdd464

  const tailwindResult = await cssToTailwind(`
.selector {
  display: flex;
  align-items: center;
  column-gap: 1.25rem;
}

@media (min-width: 768px) {
  .selector {
    column-gap: 2rem;
  }
}
`);

  expect(tailwindResult.classes).toMatchTailwindClasses(
    'flex gap-x-5 items-center md:gap-x-8',
  );
});

test('css-to-tailwind: advanced-005 (id: cc0f4f)', async () => {
  // ID: cc0f4f

  const tailwindResult = await cssToTailwind(`
.selector {
  display: flex;
  flex-direction: column;
  row-gap: 1.5rem;
}

@media (min-width: 640px) {
  .selector {
    row-gap: 2rem;
  }
}
`);

  expect(tailwindResult.classes).toMatchTailwindClasses(
    'flex flex-col gap-y-6 sm:gap-y-8',
  );
});

test('css-to-tailwind: complex-001 (id: 8fdbda)', async () => {
  // ID: 8fdbda

  const tailwindResult = await cssToTailwind(`
.selector {
  margin-left: auto;
  margin-right: auto;
  margin-top: 4rem;
  display: grid;
  max-width: 40rem;
  grid-template-columns: repeat(1, minmax(0px, 1fr));
  align-items: flex-start;
  column-gap: 2rem;
  row-gap: 2.5rem;
}

@media (min-width: 640px) {
  .selector {
    margin-top: 5rem;
  }
}

@media (min-width: 1024px) {
  .selector {
    max-width: none;
    grid-template-columns: repeat(3, minmax(0px, 1fr));
  }
}
`);

  expect(tailwindResult.classes).toMatchTailwindClasses(
    'gap-x-8 gap-y-10 grid grid-cols-1 items-start lg:grid-cols-3 lg:max-w-none max-w-2xl mt-16 mx-auto sm:mt-20',
  );
});

test('css-to-tailwind: complex-002 (id: 2ef15b)', async () => {
  // ID: 2ef15b

  const tailwindResult = await cssToTailwind(`
.selector {
  display: grid;
  grid-auto-rows: min-content;
  grid-template-columns: repeat(1, minmax(0px, 1fr));
  align-items: center;
  row-gap: 2rem;
  column-gap: 2rem;
  padding-left: 0.75rem;
  padding-right: 0.75rem;
}

@media (min-width: 640px) {
  .selector {
    grid-template-columns: repeat(2, minmax(0px, 1fr));
    row-gap: 2.5rem;
  }
}

@media (min-width: 1024px) {
  .selector {
    grid-template-columns: repeat(1, minmax(0px, 1fr));
  }
}

@media (min-width: 1280px) {
  .selector {
    padding-left: 3rem;
    padding-right: 3rem;
  }
}
`);

  expect(tailwindResult.classes).toMatchTailwindClasses(
    'auto-rows-min gap-8 grid grid-cols-1 items-center lg:grid-cols-1 px-3 sm:gap-y-10 sm:grid-cols-2 xl:px-12',
  );
});

test('css-to-tailwind: complex-003 (id: 39683a)', async () => {
  // ID: 39683a

  const tailwindResult = await cssToTailwind(`
.selector {
  scroll-margin-top: 3.5rem;
  padding-top: 4rem;
  padding-bottom: 2rem;
}

@media (min-width: 640px) {
  .selector {
    scroll-margin-top: 8rem;
    padding-top: 5rem;
    padding-bottom: 2.5rem;
  }
}

@media (min-width: 1024px) {
  .selector {
    padding-top: 8rem;
    padding-bottom: 4rem;
  }
}
`);

  expect(tailwindResult.classes).toMatchTailwindClasses(
    'lg:pb-16 lg:pt-32 pb-8 pt-16 scroll-mt-14 sm:pb-10 sm:pt-20 sm:scroll-mt-32',
  );
});

test('css-to-tailwind: complex-004 (id: 18f402)', async () => {
  // ID: 18f402

  const tailwindResult = await cssToTailwind(`
.selector {
  position: relative;
  z-index: 10;
  display: flex;
  column-gap: 1rem;
  white-space: nowrap;
  padding-left: 1rem;
  padding-right: 1rem;
}

@media (min-width: 640px) {
  .selector {
    margin-left: auto;
    margin-right: auto;
    padding-left: 0px;
    padding-right: 0px;
  }
}

@media (min-width: 1024px) {
  .selector {
    margin-left: 0px;
    margin-right: 0px;
    display: block;
    column-gap: 0px;
    row-gap: 0.25rem;
    white-space: normal;
  }
}
`);

  expect(tailwindResult.classes).toMatchTailwindClasses(
    'flex gap-x-4 lg:block lg:gap-x-0 lg:gap-y-1 lg:mx-0 lg:whitespace-normal px-4 relative sm:mx-auto sm:px-0 whitespace-nowrap z-10',
  );
});

test('css-to-tailwind: complex-005 (id: d109b9)', async () => {
  // ID: d109b9

  const tailwindResult = await cssToTailwind(`
.selector {
  min-width: 0px;
  max-width: 42rem;
  flex-grow: 1;
  flex-shrink: 1;
  flex-basis: auto;
  padding-left: 1rem;
  padding-right: 1rem;
  padding-top: 4rem;
  padding-bottom: 4rem;
}

@media (min-width: 1024px) {
  .selector {
    max-width: none;
    padding-right: 0px;
    padding-left: 2rem;
  }
}

@media (min-width: 1280px) {
  .selector {
    padding-left: 4rem;
    padding-right: 4rem;
  }
}
`);

  expect(tailwindResult.classes).toMatchTailwindClasses(
    'flex-auto lg:max-w-none lg:pl-8 lg:pr-0 max-w-2xl min-w-0 px-4 py-16 xl:px-16',
  );
});

let successCount = 0;
let hasOnly = queue.some(({ only }) => only);

for (const { name, fn, only } of queue) {
  if (hasOnly && !only) {
    console.log('⏭ ', name);
    continue;
  }

  try {
    await fn();
    successCount++;
    console.log('✅', name);
  } catch (error) {
    console.log('❌', name);
    console.error(leftPad(error.message));
    if (error.completion) {
      console.log('[OpenAI]', error.completion);
    }
  }
}

console.log();
console.log(`Success in ${successCount}/${queue.length} tests`);
