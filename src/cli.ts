#!/usr/bin/env node

import path from 'path';
import fs from 'fs';
import os from 'os';
import { execSync } from 'child_process';
import { parse } from 'ts-command-line-args';

import { Walker, globalCode, executableCode } from './compiler/walker';
import { DaisyParser } from './parser';
import { addEnds } from './parser/indent';

export const args = parse({
    sourcePath: {type: String, defaultOption: true},
    targetPath: {type: String, alias: 'o', defaultValue: ''},
    run: {type: Boolean, defaultValue: false, alias: 'r'}
});

const inputFile = args.sourcePath;
const shouldRun = args.run;
const shouldSave = args.targetPath !== '';

if (!inputFile) {
    console.error('Usage: floral <file.bud> [-o output] [--run]');
    process.exit(1);
}

const PACKAGE_ROOT = path.join(__dirname, '..');
const RUNTIME_HPP = path.join(PACKAGE_ROOT, 'cpp', 'runtime', 'runtime.hpp');
const UTIL_CPP = path.join(PACKAGE_ROOT, 'cpp', 'runtime', 'util.cpp');

if (!fs.existsSync(RUNTIME_HPP) || !fs.existsSync(UTIL_CPP)) {
    console.error('Error: Floral runtime files not found. Is the package installed correctly?');
    process.exit(1);
}

const contents = fs.readFileSync(inputFile, "utf-8");

const parser = new DaisyParser();
const ast = parser.parse(addEnds(contents));

const walker = new Walker();
walker.visit(ast);

const cppCode = `#include <runtime/runtime.hpp>
#include <cstdint>
#include <cstdio>
#include <string>

${globalCode}

int main() {
${executableCode}  return 0;
}
`;

// Write to temp directory
const buildDir = path.join(os.tmpdir(), 'floral-build');
if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
}

const baseName = path.basename(inputFile, '.bud');
const cppFile = path.join(buildDir, `${baseName}.cpp`);
fs.writeFileSync(cppFile, cppCode);

// Compile
try {
    const binPath = path.join(buildDir, baseName);
    const cmd = `g++ -std=c++20 "${cppFile}" "${UTIL_CPP}" -I"${PACKAGE_ROOT}" -I"${PACKAGE_ROOT}/cpp" -o "${binPath}"`;
    execSync(cmd, { stdio: 'inherit' });

    if (shouldSave) {
        const outPath = path.resolve(args.targetPath!);
        fs.copyFileSync(binPath, outPath);
        fs.chmodSync(outPath, 0o755);
        console.log(`Built ${outPath}`);
    }

    if (shouldRun) {
        console.log(`\nRunning:\n`);
        execSync(binPath, { stdio: 'inherit' });
    }
} catch (err) {
    console.error('Build or execution failed');
    process.exit(1);
}
