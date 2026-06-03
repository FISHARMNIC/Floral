export const RED = '\x1b[31m';
export const YELLOW = '\x1b[33m';
export const GREEN = '\x1b[32m';
export const BLUE = '\x1b[34m';
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
        console.error(`${RED}Error: ${err.message}${RESET}`);
    }

    private static formatError(message: string, line?: number, column?: number, sourceCode?: string): string {
        let fullMessage = message;

        if (line !== undefined && column !== undefined) {
            fullMessage += ` at line ${line}, column ${column}`;
        } else if (line !== undefined) {
            fullMessage += ` at line ${line}`;
        }

        if (sourceCode !== undefined) {
            fullMessage += `\n  > ${sourceCode}`;
        }

        return fullMessage;
    }
}
