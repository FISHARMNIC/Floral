import { inputFile } from "../cli";
import { activeSourceCode } from "../parser/indent";
import { activeLineNumber } from "./walker";

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

export function warn(message: string): void {
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
        let fullMessage = message;

        line ??= activeLineNumber;
        sourceCode ??= activeSourceCode.find(x => x.lineNumber == line)?.content;

        // if (line !== undefined && column !== undefined) {
        //     fullMessage += ` at line ${line}, column ${column}`;
        // } else if (line !== undefined) {
        //     fullMessage += ` at line ${line}`;
        // }

        if (sourceCode !== undefined) {
            fullMessage += `\n${RESET}${RED}┃ > ${GRAY}${inputFile}:${line}${RESET}\n${RED}┃ > ${BLUE}${sourceCode}${RESET}`;
        }

        return `${RED}┏━━*\n┃ > [Error on line ${line}] : ${BOLD}${fullMessage}${RESET}\n${RED}┗━━*`;
    }
}
