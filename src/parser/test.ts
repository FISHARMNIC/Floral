import { DaisyParser } from '.';

const examples = [
  {
    name: 'Simple let',
    code: 'let x = 5'
  },
  {
    name: 'Function with block',
    code: `function greet:
    let msg = "Hello"
    print(msg)
end`
  },
  {
    name: 'While loop',
    code: `let flag = true
while(flag):
    flag = false
end`
  },
  {
    name: 'If/elif/else with end',
    code: `if(x == 5):
    print("five")
elif(x == 10):
    print("ten")
else:
    print("other")
end`
  },
  {
    name: 'Single-line if (optional end)',
    code: `if(true): let x = 5`
  }
];

console.log('╔════════════════════════════════════════════╗');
console.log('║  DaisyLang Parser Tests                    ║');
console.log('╚════════════════════════════════════════════╝\n');

const parser = new DaisyParser();
for (const example of examples) {
  try {
    const ast = parser.parse(example.code);
    const stmtCount = ast.statements.length;
    console.log(`✅ ${example.name.padEnd(30)} - ${stmtCount} statement(s)`);
  } catch (error: any) {
    console.error(`❌ ${example.name.padEnd(30)} - ${error.message.substring(0, 60)}`);
  }
}
