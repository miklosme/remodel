import { assert, expect, test } from 'vitest';
import cssToTailwind from './';

expect.extend({
  toMatchTailwindClasses(received, argument) {
    let classesRecived = Array.from(new Set(received)).sort().join(' ');
    let classesExpected = Array.from(
      new Set(argument.split(' ').filter(Boolean)),
    )
      .sort()
      .join(' ');

    const pass = classesRecived === classesExpected;

    const message = pass ? () => 'It passes' : () => 'Does not pass';

    return { expected: argument, actual: classesRecived, message, pass };
  },
});

test('tailwind: "lg:px-8 max-w-7xl mx-auto px-4 sm:px-6"', async () => {
  const tailwindResult = await cssToTailwind(`
.single {
  margin-left: auto;
  margin-right: auto;
  max-width: 80rem;
  padding-left: 1rem;
  padding-right: 1rem;
}

@media (min-width: 640px) {
  .single {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .single {
    padding-left: 2rem;
    padding-right: 2rem;
  }
}
`);

  expect(tailwindResult.classes).toMatchTailwindClasses(
    'lg:px-8 max-w-7xl mx-auto px-4 sm:px-6',
  );
});
