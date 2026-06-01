import { Walker, globalCode, executableCode } from './compiler/walker';
import { DaisyParser } from './parser';
import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

export * as AST from './parser/ast';

const parser = new DaisyParser();

const ast = parser.parse(fs.readFileSync("examples/messages.flower", "utf-8"))

const walker = new Walker();
walker.visit(ast);

const cppCode = `#include "runtime/runtime.hpp"
#include <cstdint>
#include <cstdio>
#include <string>

${globalCode}

int main() {
${executableCode}  return 0;
}
`;

// Write to file in cpp directory
const outputFile = 'cpp/generated.cpp';
const buildDir = 'cpp/bin';
if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
}
fs.writeFileSync(outputFile, cppCode);
console.log(`Generated ${outputFile}`);

// Compile
try {
    const outFile = path.join(buildDir, 'generated.out');
    const cmd = `g++ -std=c++20 ${outputFile} cpp/runtime/util.cpp -I. -o ${outFile}`;
    console.log(`Running: ${cmd}`);
    execSync(cmd, { stdio: 'inherit' });
    console.log(`Built ${outFile}`);

    // Run
    console.log(`\nRunning ${outFile}:\n`);
    execSync(outFile, { stdio: 'inherit' });
} catch (err) {
    console.error('Build or execution failed');
    process.exit(1);
}
