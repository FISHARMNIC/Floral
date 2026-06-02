import { DaisyParser } from '.';
const code = `
function test:
    message("hello")
`;
const parser = new DaisyParser();
try {
  const ast = parser.parse(code);
  console.log('Parse successful!');
  console.log(JSON.stringify(ast, null, 2));
} catch (error: any) {
  console.error('Parse failed:', error.message);
}
