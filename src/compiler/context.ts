export class Stack<T> {
    stack: T[];

    constructor(init: T) {
        this.stack = [init];
    }

    enter(x: T): void { this.stack.push(x); }
    exit(): void { if (this.stack.length > 1) this.stack.pop(); }
    setActive(x: T): void { this.stack[this.stack.length - 1] = x; }
    getActive(): T { return this.stack.at(-1)!; }
}

class CompileSession {
    importCache: Map<string, any> = new Map();
    inputFileStack: Stack<string> = new Stack('');
    lineNumberStack: Stack<number> = new Stack(1);

    reset(initialFile: string): void {
        this.importCache = new Map();
        this.inputFileStack = new Stack(initialFile);
        this.lineNumberStack = new Stack(1);
    }
}

export const session = new CompileSession();
