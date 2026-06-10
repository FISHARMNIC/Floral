import { session } from "./context";
import { activeSourceCode } from "../parser/indent";
import stripAnsi from 'strip-ansi';

export const RED = '\x1b[31m';
export const YELLOW = '\x1b[33m';
export const GREEN = '\x1b[32m';
export const BLUE = '\x1b[34m';
export const CYAN = '\x1b[36m';
export const MAGENTA = '\x1b[35m';
export const WHITE = '\x1b[37m';
export const GRAY = '\x1b[90m';
export const BOLD = '\x1b[1m';
export const DIM = '\x1b[2m';
export const RESET = '\x1b[0m';

export function DSWarn(message: string): void {
    console.warn(`${YELLOW}Warning: ${message}${RESET}`);
}

export class DSError extends Error {
    constructor(
        message: string,
        public line?: number,
        public column?: number,
        public sourceCode?: string
    ) {
        const fullMessage = DSError.formatError(message, line, column, sourceCode);
        super(fullMessage);
        this.name = 'DSError';
        Object.setPrototypeOf(this, DSError.prototype);
    }

    static print(err: DSError): void {
        console.error(err.message);
    }

    private static formatError(message: string, line?: number, column?: number, sourceCode?: string): string {

        line ??= session.lineNumberStack.getActive();
        sourceCode ??= activeSourceCode.find(x => x.lineNumber == line)?.content;

        const s = `${RED}[Error on line ${line}] : ${BOLD}${message}${RESET}`;

        let fullMessage = [s];


        // if (line !== undefined && column !== undefined) {
        //     fullMessage += ` at line ${line}, column ${column}`;
        // } else if (line !== undefined) {
        //     fullMessage += ` at line ${line}`;
        // }

        if (sourceCode !== undefined) {
            
            // for(let i = session.inputFileStack.stack.length - 1; i >= 0; i--) // ew
            // {
            //     fullMessage.push(`${GRAY}${session.inputFileStack.stack[i]}:${session.lineNumberStack.stack[i]}${RESET}`)
            // }
            
            session.inputFileStack.stack.forEach((x,i) => {
                fullMessage.push(`${GRAY}${i + 1}) ${x}:${session.lineNumberStack.stack[i]}${RESET}`)
            })
            
            fullMessage.push(`${BLUE}${sourceCode}${RESET}`);
        }

        const longest = Math.max(...fullMessage.map(x => stripAnsi(x).length));

        const inner = fullMessage.map(x => `${RED}┃ >${RESET} ${x}${" ".repeat(longest - stripAnsi(x).length)} ${RESET}${RED}┃${RESET}`);
        inner.unshift(`${RED}┏━━*${" ".repeat(longest - 2)}*━━┓${RESET}`);
        inner.push(`${RED}┗━━*${" ".repeat(longest - 2)}*━━┛${RESET}`)

        return inner.join("\n");
        // return `${RED}┏━━*\n┃ > [Error on line ${line}] : ${BOLD}${fullMessage}${RESET}\n${RED}┗━━*`;
    }
}
