import fs from "fs";
import path from "path";
const { execSync } = require('child_process');

const rootDir = __dirname + "/../";
const examplesDir = rootDir + "examples/";
const libsDir = examplesDir + "libs/";
const testsDir = examplesDir + "tests/";

const files = [...fs.readdirSync(examplesDir), ...fs.readdirSync(libsDir).map(x => "libs/" + x), ...fs.readdirSync(testsDir).map(x => "tests/" + x)].filter(x => x.includes(".bud"));

const delims = {
    start: "@@@EXPECTS@@@\n",
    end: "@@@END@@@",
    print: "@@@PRINT@@@"
};

const counters = {
    passed: 0,
    printed: 0,
    skipped: 0
}

import { spawnSync } from 'child_process';

function getOutput(cmd: string): { ok: boolean, out: string } {
    const result = spawnSync(cmd, {
        encoding: 'utf8',
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe'],
    });

    return {
        out: result.stdout,
        ok: result.status === 0 && !(result.stderr.includes("┏━━")), // whatever change later
    };
}

const c = {
    red: (s: any) => `\x1b[31m${s}\x1b[0m`,
    green: (s: any) => `\x1b[32m${s}\x1b[0m`,
    yellow: (s: any) => `\x1b[33m${s}\x1b[0m`,
    blue: (s: any) => `\x1b[34m${s}\x1b[0m`,
    cyan: (s: any) => `\x1b[36m${s}\x1b[0m`,
    bold: (s: any) => `\x1b[1m${s}\x1b[0m`,
    dim: (s: any) => `\x1b[2m${s}\x1b[0m`,
};

const res = files.every((file: string): boolean => {

    const dir = examplesDir + file;

    const contents = fs.readFileSync(dir).toString();

    const start = contents.indexOf(delims.start);
    const end = contents.indexOf(delims.end);
    const print = contents.indexOf(delims.print);

    const shouldSlice = start != -1 && end != -1;
    const shouldPrint = print != -1;

    if (!shouldSlice && !shouldPrint) {
        console.log(c.green("[  SKIP  ]"), dir);
        counters.skipped++;
        return true;
    }

    const execute = `"${process.execPath}" "${path.join(__dirname, 'cli.js')}" --run ${dir} --sanitize`;
    const res = getOutput(execute);

    if (shouldPrint) {
        console.log(c.blue(`\n**RESULT OF ${dir}**`));
        console.log(c.yellow(res.out));
        console.log(c.blue(`**END RESULT**\n`))

        if (!shouldSlice) {
            if (!res.ok) {
                console.log(c.red("[  FAIL1 ]"), file);
                return false;
            }
            counters.printed++;
        }
    }

    if (shouldSlice) {
        const checkWith = contents.slice(start + delims.start.length, end);
        if(res.ok)
        {
        if (res.out == checkWith) {
            console.log(c.green("[ PASS   ]"), file);
            counters.passed++;
            return true;
        }
        else {
            console.log(c.red("[  FAIL2 ]"), file);
            console.log(`GOT:{{{${res.out}}}}\n\nEXP:{{{${checkWith}}}}`);

            return false;
        }
        }
        else
        {
            console.log(c.red("[  FAIL3 ]"), file);
            console.log(`GOT:${res.out}`)
            return false;
        }
    }

    return true;
})

if (res) {
    console.log(c.green("\nALL FILES OK:"))
    console.log(`* passed  : ${counters.passed}\n* printed : ${counters.printed}\n* skipped : ${counters.skipped}\n\n`)
}
else {
    console.log(c.red("\n[FILE FAILED]\n\n!!!MAKE SURE NOT RUN FROM VSCODE, USE CLI (fix later)!!!\n\n"))
}

// fs.readdirSync()