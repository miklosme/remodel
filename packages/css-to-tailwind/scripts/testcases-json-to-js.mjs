import { promises as fs } from 'fs';

const testcases = JSON.parse(
  await fs.readFile('./scripts/testcases.json', 'utf8'),
);

testcases.forEach((testcase) => {
  console.log(`
test('tailwind: "${testcase.classes}"', async () => {
  const tailwindResult = await cssToTailwind(\`${testcase.mergedCss}\`);

  expect(tailwindResult.classes).toMatchTailwindClasses('${testcase.classes}');
});
  `);
  console.log();
});
