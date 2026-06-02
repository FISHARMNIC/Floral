import { Walker, globalCode, executableCode } from './compiler/walker';
import { DaisyParser } from './parser';
import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { DSError } from './compiler/DSError';

export * as AST from './parser/ast';

const parser = new DaisyParser();

const inputFile = process.argv[2] || "examples/messages.flower";
const contents = fs.readFileSync(inputFile, "utf-8");


export function addEnds(content: string): string // @todo lazy and temprorary function
{
    const idx = content.indexOf(":\n") + 2;
    if(idx == 1)
    {
        return content;
    }

    const spacechar = content[idx];

    if(!(spacechar == " " || spacechar == "\t"))
    {
        throw new DSError(`Character "${spacechar}" cannot be used as newline`);
    }

    let indendationAmount = 0;
    while(content[indendationAmount + idx] == spacechar)
    {
        indendationAmount++
    }

    const contentArr = content.split("\n");

    const tab = spacechar.repeat(indendationAmount);
    
    const mapped = contentArr.map(x => {
        let i = 0;

        while(true)
        {
            if(x.trim().length == 0)
            {
                x = "";
            }

            const s = i * indendationAmount;
            const sliced = x.slice(s, s + indendationAmount);
            if(sliced[0] != spacechar)
            {
                break;
            }
            else if(sliced != tab)
            {
                throw new DSError(`Bad indentation level, expected [${indendationAmount}] ${spacechar == " "? "space(s)" : "tab(s)"}`);
            }
            i++;
        }
        return {indent: i, content: x, trimmed: x.slice(indendationAmount * i)}
    })

    let final = ""
    for(let i = 1; i < mapped.length; i++)
    {
        const prev = mapped[i-1];
        const curr = mapped[i];

        const first4 = curr.trimmed.slice(0,4);

        // console.log("FIRST4", first4)
        if(curr.indent < prev.indent && first4 != "elif" && first4 != "else" && first4 != "end")
        {
            const ind = prev.indent - 1
            const s = tab.repeat(ind) + "end";
            mapped.splice(i, 0, {indent: ind, content: s, trimmed: s.slice(ind * indendationAmount)})
        }

        final += prev.content + '\n';
    }

    // console.log(final);
    // process.exit();

    return final;
}



const ast = parser.parse(addEnds(contents))


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
