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
