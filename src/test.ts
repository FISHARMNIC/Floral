import { DaisyParser } from './parser';

// Your full DaisyLang example
const fullExample = `#INCLUDE("filesystem", "fstream")

function readfile(String path) -> String:
	#CPP("
auto size = std::filesystem::file_size(\${path});
std::string content(size, '\\0');
std::ifstream in(\${path});
in.read(&content[0], size);
return Daisy::String(content);
	")

function parseCSV -> Integer:
	message "opening file"
	let file = readfile("numbers.csv")
	message "performing computation"
	let res = file.split(",").Integer().reduce(lam(a,b): a + b)
	return res

let res = spawn parseCSV()
print(await res)`;

console.log('╔════════════════════════════════════════════╗');
console.log('║  DaisyLang Parser - Full Example Test      ║');
console.log('╚════════════════════════════════════════════╝\n');

try {
  const parser = new DaisyParser();
  const ast = parser.parse(fullExample);

  console.log('✅ Parse successful!\n');
  console.log('📊 Parsed Program:');
  console.log(`   - ${ast.statements.length} top-level statements`);
  console.log(`   - Includes: ${ast.statements.filter(s => s.type === 'IncludeStatement').length}`);
  console.log(`   - Functions: ${ast.statements.filter(s => s.type === 'FunctionDef').length}`);
  console.log(`   - Variables: ${ast.statements.filter(s => s.type === 'LetStatement').length}\n`);

  console.log('🌳 Full AST:');
  console.log(JSON.stringify(ast, null, 2));

} catch (error: any) {
  console.error('❌ Parse Error:', error.message);
}
