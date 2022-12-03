import { assert, expect, test } from 'vitest';
import cssToTailwind from './';
import testcases from '../scripts/testcases.json';

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

testcases.forEach((testcase) => {
  test(`tailwind: "${testcase.classes}"`, async () => {
    const tailwindResult = await cssToTailwind(testcase.mergedCss);

    expect(tailwindResult.classes).toMatchTailwindClasses(testcase.classes);
  });
});
