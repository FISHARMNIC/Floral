#!/usr/bin/env node

import path from 'path';
import fs from 'fs';
import os from 'os';
import { spawn } from 'child_process';
import { parse } from 'ts-command-line-args';
import ora from 'ora';

import { Walker } from './compiler/walker';
import { BLUE, DSError, GREEN, RED, RESET } from './compiler/DSError';
import { DaisyParser } from './parser';
import { addEnds } from './parser/indent';
import { session } from './compiler/context';

let args: any;

try {
    args = parse({
        sourcePath: { type: String, defaultOption: true },
        targetPath: { type: String, alias: 'o', defaultValue: '' },
        run: { type: Boolean, defaultValue: false, alias: 'r' },
        generate: { type: Boolean, defaultValue: false, alias: 'g' },
        sanitize: { type: Boolean, defaultValue: false },
        time: { type: Boolean, defaultValue: false },
    }, undefined, false);
}
catch {
    args = {};
}

session.reset(path.resolve(args.sourcePath ?? ''));

const shouldRun = args.run;
const shouldSave = args.targetPath !== '';
const shouldGenerate = args.generate;
const shouldSanitize = args.sanitize;
const shouldTime = args.time;

if (!session.inputFileStack.getActive() || (!shouldSave && !shouldRun && !shouldGenerate)) {
    console.error(`Usage:
*    bud --run examples/showcase.bud        | compile and run
*    bud examples/showcase.bud -o a.out     | compile to binary
*    bud examples/showcase.bud --generate   | generate C++ code`);
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
    contents = fs.readFileSync(session.inputFileStack.getActive(), "utf-8");
}
catch (e) {
    console.error("Error: No file exists: ", session.inputFileStack.getActive(), e);
    process.exit(1);
}
const baseName = path.basename(session.inputFileStack.getActive(), '.bud');
let ast: any;
const walker = new Walker();
walker.sourceFile = session.inputFileStack.getActive();
try {
    const parser = new DaisyParser();
    const processedLines = addEnds(contents);
    const source = processedLines.map(l => l.content).join('\n');
    const lineMap = processedLines.map(l => l.lineNumber);
    ast = parser.parse(source, lineMap);
    walker.visit(ast);
} catch (err) {
    if (err instanceof DSError) {
        DSError.print(err);
    } else {
        console.error(err);
    }
    process.exit(1);
}

const cppCode = `
module;
#include <runtime/runtime.hpp>
#include <cstdint>
#include <cstdio>
#include <string>
${walker.includeCode}
export module ${baseName};

${walker.globalCode}

extern "C++" {
int main() {
Daisy::builtin::file::_exe_path = "${session.inputFileStack.getActive().replace(/\\/g, '\\\\')}";

${walker.executableCode}

Daisy::Threads::join_all();
return 0;
}
}
`;

const buildDir = path.join(os.tmpdir(), 'floral-build');
if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
}

for (const { src, basename } of walker.localIncludes) {
    try {
        fs.copyFileSync(src, path.join(buildDir, basename));
    }
    catch {
        console.log(`Error: File "${src}" does not exist`);
        process.exit(1)
    }
}

const cppFile = path.join(buildDir, `${baseName}.cppm`);
fs.writeFileSync(cppFile, cppCode);

if (shouldGenerate) {
    const localCpp = path.join(process.cwd(), 'generated.cppm');
    fs.writeFileSync(localCpp, cppCode);
    console.log(`${BLUE}Generated C++: ${localCpp}${RESET}`);
}

(async () => {
    try {
        const binPath = path.join(buildDir, baseName);
        const cmd = `clang++ -std=c++20 ${shouldSanitize ? "-fsanitize=address" : ""} -fmodules "${cppFile}" "${UTIL_CPP}" -I"${PACKAGE_ROOT}" -I"${PACKAGE_ROOT}/cpp" -o "${binPath}"`;

        const spinner = ora(`${BLUE}Compiling...${RESET}`)
        spinner.spinner = "sand";
        spinner.start()

        await new Promise<void>((resolve, reject) => {
            const proc = spawn('bash', ['-c', cmd], { cwd: buildDir });
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
            console.log(`${BLUE}Built: ${outPath}${RESET}`);
        }

        if (shouldRun) {
            await new Promise<void>((resolve, reject) => {
                // const proc = spawn((shouldTime? "time " : "") + binPath, [], { stdio: ['inherit', 'inherit', 'inherit'] });
                const proc = spawn(shouldTime ? "time" : binPath, shouldTime ? [binPath] : [], {
                    stdio: ['inherit', 'inherit', 'inherit'],
                });
                proc.on('close', (code, signal) => {
                    if (code === 0) resolve();
                    else reject(new Error(`Process exited with code "${code}", signal "${signal}"`));
                });
            });
        }
    } catch (err) {
        console.log(`${RED}[ !CRASH! ]${RESET} - ${err}`)
        process.exit(1);
    }
})();
