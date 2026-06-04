import { DTypes } from "./DTypes";
import { DSError } from "./DSError";

type ScopeInfo = DTypes.Function;

export enum ScopeType {
    If = "if",
    Function = "function",
    Global = "global",
    While = "while"
}

type ScopeEntry = { type: ScopeType, info?: ScopeInfo, variables: Record<string, DTypes.Type>, functions: Record<string, DTypes.Type> };

const BUILTIN_FUNCTIONS: Record<string, DTypes.Function> = {
    send: {
        name: "send",
        cname: "__DAISY_channel.send",
        params: [{ name: "msg", type: DTypes.resolve("String") }],
        returnType: DTypes.resolve("None"),
        minParams: 0
    },
    receive: {
        name: "receive",
        cname: "__DAISY_channel.receive",
        params: [],
        returnType: DTypes.resolve("String")
    },
    canReceive: {
        name: "canReceive",
        cname: "__DAISY_channel.canReceive",
        params: [],
        returnType: DTypes.resolve("Bool")
    },
    pending: {
        name: "pending",
        cname: "__DAISY_channel.pending",
        params: [],
        returnType: DTypes.resolve("Bool")
    },
    print: {
        name: "print",
        cname: "Daisy::print",
        params: [{ name: "value", type: { kind: "any" } }],
        returnType: DTypes.resolve("None"),
        minParams: 0,
        variadic: true,
    },
    sleep_ms: {
        name: "sleep_ms",
        cname: "Daisy::Timing::sleep_ms",
        params: [{ name: "value", type: DTypes.resolve("Integer") }],
        returnType: DTypes.resolve("None")
    },
    toInteger: {
        name: "toInteger",
        cname: "Daisy::util::strtoint",
        params: [{ name: "value", type: DTypes.resolve("String") }],
        returnType: DTypes.resolve("Integer")
    },
    toFloat: {
        name: "toFloat",
        cname: "Daisy::util::strtofloat",
        params: [{ name: "value", type: DTypes.resolve("String") }],
        returnType: DTypes.resolve("Float")
    },
    intToString: {
        name: "toString",
        cname: "std::to_string",
        params: [{ name: "value", type: DTypes.resolve("Integer") }],
        returnType: DTypes.resolve("String")
    },
    intToFloat: {
        name: "intToFloat",
        cname: "Daisy::util::inttofloat",
        params: [{ name: "value", type: DTypes.resolve("Integer") }],
        returnType: DTypes.resolve("Float")
    },
};

export class Scope {

    private globals: ScopeEntry = {
        type: ScopeType.Global,
        variables: {
            process: {
                kind: "class", type: {
                    properties: [],
                    name: "process",
                    methods: {
                        "exec": {
                            name: "exec",
                            cname: "Daisy::builtin::process::exec",
                            returnType: DTypes.resolve("String"),
                            params: [{ name: "path", type: DTypes.resolve("String") }],
                            isPseudomethod: true
                        }
                    }
                }, const: true
            },
            file: {
                kind: "class", type: {
                    properties: [],
                    name: "file",
                    methods: {
                        "read": {
                            name: "read",
                            cname: "Daisy::builtin::file::read",
                            returnType: DTypes.resolve("String"),
                            params: [{ name: "path", type: DTypes.resolve("String") }],
                            isPseudomethod: true
                        },
                        "resolve": {
                            name: "resolve",
                            cname: "Daisy::builtin::file::resolve",
                            returnType: DTypes.resolve("String"),
                            params: [{ name: "filename", type: DTypes.resolve("String") }],
                            isPseudomethod: true
                        },
                        "write": {
                            name: "write",
                            cname: "Daisy::builtin::file::write",
                            returnType: DTypes.resolve("Bool"),
                            params: [{ name: "path", type: DTypes.resolve("String") }, { name: "content", type: DTypes.resolve("String") }],
                            isPseudomethod: true
                        },
                        "append": {
                            name: "append",
                            cname: "Daisy::builtin::file::append",
                            returnType: DTypes.resolve("Bool"),
                            params: [{ name: "path", type: DTypes.resolve("String") }, { name: "content", type: DTypes.resolve("String") }],
                            isPseudomethod: true
                        },
                        "exists": {
                            name: "exists",
                            cname: "Daisy::builtin::file::exists",
                            returnType: DTypes.resolve("Bool"),
                            params: [{ name: "path", type: DTypes.resolve("String") }],
                            isPseudomethod: true
                        },
                        "remove": {
                            name: "remove",
                            cname: "Daisy::builtin::file::remove",
                            returnType: DTypes.resolve("Bool"),
                            params: [{ name: "path", type: DTypes.resolve("String") }],
                            isPseudomethod: true
                        },
                        "mkdir": {
                            name: "mkdir",
                            cname: "Daisy::builtin::file::mkdir",
                            returnType: DTypes.resolve("Bool"),
                            params: [{ name: "path", type: DTypes.resolve("String") }],
                            isPseudomethod: true
                        },
                        "size": {
                            name: "size",
                            cname: "Daisy::builtin::file::size",
                            returnType: DTypes.resolve("Integer"),
                            params: [{ name: "path", type: DTypes.resolve("String") }],
                            isPseudomethod: true
                        },
                        "listDir": {
                            name: "listDir",
                            cname: "Daisy::builtin::file::list",
                            returnType: DTypes.resolveGeneric("List", DTypes.resolve("String")),
                            params: [{ name: "path", type: DTypes.resolve("String") }],
                            isPseudomethod: true
                        }
                    },
                },
                const: true
            }
        },
        functions: {
            print: { kind: "function", type: BUILTIN_FUNCTIONS.print },
            sleep_ms: { kind: "function", type: BUILTIN_FUNCTIONS.sleep_ms },
            toInteger: { kind: "function", type: BUILTIN_FUNCTIONS.toInteger },
            toFloat: { kind: "function", type: BUILTIN_FUNCTIONS.toFloat },
            intToFloat: { kind: "function", type: BUILTIN_FUNCTIONS.intToFloat },
        }
    };
    private stack: ScopeEntry[] = [];

    constructor() {
        this.globals.functions['toString'] = { kind: "function", type: BUILTIN_FUNCTIONS.intToString };
    }

    enter(type: ScopeType, info?: ScopeInfo): void {
        this.stack.push({ type, info, variables: {}, functions: {} });
    }

    exit(): void {
        this.stack.pop();
    }

    inGlobalScope(): boolean
    {
        return this.stack.length == 0;
    }

    findParentScope(type?: ScopeType): ScopeEntry | undefined {
        if (type) {
            for (let i = 1; i <= this.stack.length; i++) {
                const entry = this.stack.at(-i);
                if (entry?.type === type) {
                    return entry;
                }
            }
        }


        return type ? undefined : this.stack.at(-1);
    }

    function_mark(name: string, func: DTypes.Function, scopeit: boolean = false) {
        const variables = this.stack.at(-1) ?? this.globals;
        variables.functions[name] = { kind: "function", type: func };

        if (scopeit) {
            this.enter(ScopeType.Function, func);
            func.params.forEach(param => {
                this.variable_mark(param);
                // wrapped is already encoded in param.type — no separate markShared needed
            });

            this.function_mark("send", BUILTIN_FUNCTIONS.send);
            this.function_mark("receive", BUILTIN_FUNCTIONS.receive);
            this.function_mark("canReceive", BUILTIN_FUNCTIONS.canReceive);
            this.function_mark("pending", BUILTIN_FUNCTIONS.pending);

        }
    }

    function_find(name: string): DTypes.Function {
        for (let i = 1; i <= this.stack.length; i++) {
            const entry = this.stack.at(-i)!;
            if (name in entry.functions) {
                const type = entry.functions[name];
                if (type.kind === "function") {
                    return type.type;
                }
            }
        }

        const globalFunc = this.globals.functions[name];
        if (globalFunc?.kind === "function") {
            return globalFunc.type;
        }

        throw new DSError(`Function '${name}' not found`);
    }

    function_findType(name: string): DTypes.Type | undefined {
        for (let i = 1; i <= this.stack.length; i++) {
            const entry = this.stack.at(-i)!;
            if (name in entry.functions) {
                return entry.functions[name];
            }
        }

        return this.globals.functions[name];
    }

    function_getName(func: DTypes.Function): string {
        return func.cname ?? func.name;
    }

    variable_mark(info: DTypes.TypedValue, global: boolean = false): void {
        if (global) {
            this.globals.variables[info.name] = info.type;  // @todo prototype pollution
        }
        else {
            const scope = this.stack.at(-1) ?? this.globals;
            scope.variables[info.name] = info.type;
        }
    }

    variable_find(name: string): DTypes.Type {
        for (let i = 1; i <= this.stack.length; i++) {
            let level = this.stack.at(-i)!.variables;
            if (name in level) {
                return level[name];
            }
        }

        const globalVar = this.globals.variables[name];
        if (globalVar) {
            return globalVar;
        }

        throw new DSError(`Variable '${name}' not found`);
    }

    variable_isShared(name: string): boolean {
        return this.variable_find(name).wrapped === true;
    }

    variable_isGlobal(name: string): boolean {
        return name in this.globals.variables;
    }

    variable_resolvesFromGlobal(name: string): boolean {
        for (let i = 1; i <= this.stack.length; i++) {
            if (name in this.stack.at(-i)!.variables) return false;
        }
        return name in this.globals.variables;
    }

};
