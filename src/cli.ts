#!/usr/bin/env node

import path from 'path';
import fs from 'fs';
import os from 'os';
import { spawn } from 'child_process';
import { parse } from 'ts-command-line-args';
import ora from 'ora';

import { Walker, globalCode, executableCode } from './compiler/walker';
import { BLUE, DSError, GREEN, RED, RESET } from './compiler/DSError';
import { DaisyParser } from './parser';
import { addEnds } from './parser/indent';

let args: any;

try {
args = parse({
    sourcePath: { type: String, defaultOption: true },
    targetPath: { type: String, alias: 'o', defaultValue: '' },
    run: { type: Boolean, defaultValue: false, alias: 'r' },
    generate: { type: Boolean, defaultValue: false, alias: 'g' }
}, undefined, false);
}
catch
{
args = {};
}

const inputFile = args.sourcePath;
const shouldRun = args.run;
const shouldSave = args.targetPath !== '';

if (!inputFile) {
    console.error(`Usage:
*    floral --run examples/showcase.bud        | compile and run
*    floral examples/showcase.bud -o a.out     | compile to binary
*    floral examples/showcase.bud --generate   | generate C++ code`);
    process.exit(1);
}

const PACKAGE_ROOT = path.join(__dirname, '..');
const RUNTIME_HPP = path.join(PACKAGE_ROOT, 'cpp', 'runtime', 'runtime.hpp');
const UTIL_CPP = path.join(PACKAGE_ROOT, 'cpp', 'runtime', 'util.cpp');

if (!fs.existsSync(RUNTIME_HPP) || !fs.existsSync(UTIL_CPP)) {
    console.error('Error: Floral runtime files not found. Is the package installed correctly?');
    process.exit(1);
}

let contents;

try {
    contents = fs.readFileSync(inputFile, "utf-8");
}
catch {
    console.error("Error: No file exists: ", inputFile);
    process.exit(1);
}

let ast: any;
const walker = new Walker();
try {
    const parser = new DaisyParser();
    ast = parser.parse(addEnds(contents));
    walker.visit(ast);
} catch (err) {
    if (err instanceof DSError) {
        DSError.print(err);
    } else {
        console.error(err);
    }
    process.exit(1);
}

const cppCode = `#include <runtime/runtime.hpp>
#include <cstdint>
#include <cstdio>
#include <string>

${globalCode}

int main() {
${executableCode}  Daisy::Threads::join_all();
  return 0;
}
`;

const buildDir = path.join(os.tmpdir(), 'floral-build');
if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
}

const baseName = path.basename(inputFile, '.bud');
const cppFile = path.join(buildDir, `${baseName}.cpp`);
fs.writeFileSync(cppFile, cppCode);

if (args.generate) {
    const localCpp = path.join(process.cwd(), 'generated.cpp');
    fs.writeFileSync(localCpp, cppCode);
    console.log(`Generated ${localCpp}`);
}

(async () => {
    try {
        const binPath = path.join(buildDir, baseName);
        const cmd = `g++ -std=c++20 "${cppFile}" "${UTIL_CPP}" -I"${PACKAGE_ROOT}" -I"${PACKAGE_ROOT}/cpp" -o "${binPath}"`;

        const spinner = ora(`${BLUE}Compiling...${RESET}`)
        spinner.spinner = "sand";
        spinner.start()

        await new Promise<void>((resolve, reject) => {
            const proc = spawn('bash', ['-c', cmd]);
            proc.stdout?.pipe(process.stdout);
            proc.stderr?.pipe(process.stderr);
            proc.on('close', (code) => {
                if (code === 0) {
                    spinner.succeed(`${GREEN}Compiled${RESET}`);
                    resolve();
                } else {
                    spinner.fail('Compilation failed');
                    reject(new Error(`Compilation failed with code ${code}`));
                }
            });
            proc.on('error', (err) => {
                spinner.fail(`${RED}Compilation failed${RESET}`);
                reject(err);
            });
        });

        if (shouldSave) {
            const outPath = path.resolve(args.targetPath!);
            fs.copyFileSync(binPath, outPath);
            fs.chmodSync(outPath, 0o755);
            console.log(`Built ${outPath}`);
        }

        if (shouldRun) {
            await new Promise<void>((resolve, reject) => {
                const proc = spawn(binPath);
                proc.stdout?.pipe(process.stdout);
                proc.stderr?.pipe(process.stderr);
                proc.on('close', (code) => {
                    if (code === 0) resolve();
                    else reject(new Error(`Process exited with code ${code}`));
                });
            });
        }
    } catch (err) {
        process.exit(1);
    }
})();
