import { DaisyParser } from '.';
import * as fs from 'fs';
import * as path from 'path';
const examplesDir = path.join(__dirname, '../examples');
const files = ['file.flower', 'login.flower', 'login2.flower', 'messages.flower'];
console.log('Testing example files...\n');
const parser = new DaisyParser();
for (const file of files) {
  const filePath = path.join(examplesDir, file);
  try {
    const code = fs.readFileSync(filePath, 'utf-8');
    const ast = parser.parse(code);
    const statementCount = ast.statements.length;
    const functionCount = ast.statements.filter(s => s.type === 'FunctionDef').length;
    console.log(`${file.padEnd(20)} - ${statementCount} statements (${functionCount} functions)`);
  } catch (error: any) {
    console.error(`${file.padEnd(20)} - ${error.message.substring(0, 80)}`);
  }
}
