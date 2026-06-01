import { tokenizeWithIndentation } from './lexer';
import * as fs from 'fs';
import * as path from 'path';

const code = fs.readFileSync(path.join(__dirname, '..', 'examples', 'login.flower'), 'utf-8');

const result = tokenizeWithIndentation(code);

console.log('All INDENT/DEDENT tokens:');
result.tokens
  .map((t: any, i: number) => ({ token: t, index: i }))
  .filter((x: any) => x.token.tokenType.name === 'Indent' || x.token.tokenType.name === 'Dedent')
  .forEach((x: any) => {
    console.log(`${x.index}: ${x.token.tokenType.name} (line ${x.token.startLine}:${x.token.startColumn})`);
  });

console.log('\nFirst 50 tokens:');
result.tokens.slice(0, 50).forEach((token: any, i: number) => {
  const type = token.tokenType.name;
  const image = token.image ? `"${token.image}"` : '(empty)';
  console.log(`${i}: ${type} = ${image} (line ${token.startLine})`);
});

console.log(`\nTotal tokens: ${result.tokens.length}`);
