import { DTypes } from "./DTypes";
import { DSError } from "./DSError";
import { StringifyType } from "../generator/generator";

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
        cname: "Daisy::builtin::io::print",
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
        cname: "Daisy::util::toInteger",
        params: [{ name: "value", type: DTypes.resolve("String") }],
        returnType: DTypes.resolve("Integer")
    },
    toFloat: {
        name: "toFloat",
        cname: "Daisy::util::toFloat",
        params: [{ name: "value", type: DTypes.resolve("String") }],
        returnType: DTypes.resolve("Float")
    },
    intToString: {
        name: "toString",
        cname: "Daisy::util::toString",
        params: [{ name: "value", type: { kind: "any" } as DTypes.Type }],
        returnType: DTypes.resolve("String")
    },
    timeout_ms: {
        name: "timeout_ms",
        cname: "Daisy::Timing::timeout",
        params: [
            { name: "time_ms", type: DTypes.resolve("Integer") },
            { name: "child", type: { kind: "any" } as DTypes.Type }
        ],
        returnType: { kind: "any" } as DTypes.Type,
        inferReturnTypeFromArgs: (args) => {
            const handlerType = args[1]?.type;
            if (DTypes.isClass(handlerType) && (handlerType as any).type.methods?.await) {
                const innerType = (handlerType as any).type.methods.await.returnType;
                return DTypes.resolveGeneric("TimeoutResponse", innerType);
            }
            else {
                throw new DSError(`timeout_ms expects a Handler (result of "spawn") as its second argument, but given "${StringifyType(handlerType)}"`)  // @todo fix this mess and import properly automatically templated functions
            }
        }
    }
};

export class Scope {

    private globals: ScopeEntry = {
        type: ScopeType.Global,
        variables: {
            process: {
                kind: "class", type: {
                    properties: {},
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
                    properties: {},
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
            },
            web: {
                kind: "class", type: {
                    properties: {},
                    name: "web",
                    methods: {
                        "fetch": {
                            name: "fetch",
                            cname: "Daisy::builtin::web::fetch",
                            returnType: DTypes.resolve("String"),
                            params: [{ name: "path", type: DTypes.resolve("String") }],
                            isPseudomethod: true
                        }
                    }
                }, const: true
            },
            math: {
                kind: "class", type: {
                    properties: {},
                    name: "math",
                    methods: {
                        "sin": {
                            name: "sin",
                            cname: "std::sin",
                            returnType: DTypes.resolve("Float"),
                            params: [{ name: "x", type: DTypes.resolve("Float") }],
                            isPseudomethod: true
                        },
                        "cos": {
                            name: "cos",
                            cname: "std::cos",
                            returnType: DTypes.resolve("Float"),
                            params: [{ name: "x", type: DTypes.resolve("Float") }],
                            isPseudomethod: true
                        },
                        "tan": {
                            name: "tan",
                            cname: "std::tan",
                            returnType: DTypes.resolve("Float"),
                            params: [{ name: "x", type: DTypes.resolve("Float") }],
                            isPseudomethod: true
                        },
                        "asin": {
                            name: "asin",
                            cname: "std::asin",
                            returnType: DTypes.resolve("Float"),
                            params: [{ name: "x", type: DTypes.resolve("Float") }],
                            isPseudomethod: true
                        },
                        "acos": {
                            name: "acos",
                            cname: "std::acos",
                            returnType: DTypes.resolve("Float"),
                            params: [{ name: "x", type: DTypes.resolve("Float") }],
                            isPseudomethod: true
                        },
                        "atan": {
                            name: "atan",
                            cname: "std::atan",
                            returnType: DTypes.resolve("Float"),
                            params: [{ name: "x", type: DTypes.resolve("Float") }],
                            isPseudomethod: true
                        },
                        "atan2": {
                            name: "atan2",
                            cname: "std::atan2",
                            returnType: DTypes.resolve("Float"),
                            params: [{ name: "y", type: DTypes.resolve("Float") }, { name: "x", type: DTypes.resolve("Float") }],
                            isPseudomethod: true
                        },
                        "sqrt": {
                            name: "sqrt",
                            cname: "std::sqrt",
                            returnType: DTypes.resolve("Float"),
                            params: [{ name: "x", type: DTypes.resolve("Float") }],
                            isPseudomethod: true
                        },
                        "pow": {
                            name: "pow",
                            cname: "std::pow",
                            returnType: DTypes.resolve("Float"),
                            params: [{ name: "base", type: DTypes.resolve("Float") }, { name: "exp", type: DTypes.resolve("Float") }],
                            isPseudomethod: true
                        },
                        "abs": {
                            name: "abs",
                            cname: "std::abs",
                            returnType: DTypes.resolve("Float"),
                            params: [{ name: "x", type: DTypes.resolve("Float") }],
                            isPseudomethod: true
                        },
                        "absInt": {
                            name: "absInt",
                            cname: "std::abs",
                            returnType: DTypes.resolve("Integer"),
                            params: [{ name: "x", type: DTypes.resolve("Integer") }],
                            isPseudomethod: true
                        },
                        "floor": {
                            name: "floor",
                            cname: "std::floor",
                            returnType: DTypes.resolve("Float"),
                            params: [{ name: "x", type: DTypes.resolve("Float") }],
                            isPseudomethod: true
                        },
                        "ceil": {
                            name: "ceil",
                            cname: "std::ceil",
                            returnType: DTypes.resolve("Float"),
                            params: [{ name: "x", type: DTypes.resolve("Float") }],
                            isPseudomethod: true
                        },
                        "round": {
                            name: "round",
                            cname: "std::round",
                            returnType: DTypes.resolve("Float"),
                            params: [{ name: "x", type: DTypes.resolve("Float") }],
                            isPseudomethod: true
                        },
                        "log": {
                            name: "log",
                            cname: "std::log",
                            returnType: DTypes.resolve("Float"),
                            params: [{ name: "x", type: DTypes.resolve("Float") }],
                            isPseudomethod: true
                        },
                        "log2": {
                            name: "log2",
                            cname: "std::log2",
                            returnType: DTypes.resolve("Float"),
                            params: [{ name: "x", type: DTypes.resolve("Float") }],
                            isPseudomethod: true
                        },
                        "log10": {
                            name: "log10",
                            cname: "std::log10",
                            returnType: DTypes.resolve("Float"),
                            params: [{ name: "x", type: DTypes.resolve("Float") }],
                            isPseudomethod: true
                        },
                        "exp": {
                            name: "exp",
                            cname: "std::exp",
                            returnType: DTypes.resolve("Float"),
                            params: [{ name: "x", type: DTypes.resolve("Float") }],
                            isPseudomethod: true
                        },
                        "min": {
                            name: "min",
                            cname: "std::min",
                            returnType: DTypes.resolve("Float"),
                            params: [{ name: "a", type: DTypes.resolve("Float") }, { name: "b", type: DTypes.resolve("Float") }],
                            isPseudomethod: true
                        },
                        "max": {
                            name: "max",
                            cname: "std::max",
                            returnType: DTypes.resolve("Float"),
                            params: [{ name: "a", type: DTypes.resolve("Float") }, { name: "b", type: DTypes.resolve("Float") }],
                            isPseudomethod: true
                        },
                        "minInt": {
                            name: "minInt",
                            cname: "std::min",
                            returnType: DTypes.resolve("Integer"),
                            params: [{ name: "a", type: DTypes.resolve("Integer") }, { name: "b", type: DTypes.resolve("Integer") }],
                            isPseudomethod: true
                        },
                        "maxInt": {
                            name: "maxInt",
                            cname: "std::max",
                            returnType: DTypes.resolve("Integer"),
                            params: [{ name: "a", type: DTypes.resolve("Integer") }, { name: "b", type: DTypes.resolve("Integer") }],
                            isPseudomethod: true
                        },
                        "random": {
                            name: "random",
                            cname: "Daisy::math::random",
                            returnType: DTypes.resolve("Float"),
                            params: [],
                            isPseudomethod: true
                        },
                        "randomInt": {
                            name: "randomInt",
                            cname: "Daisy::math::randomInt",
                            returnType: DTypes.resolve("Integer"),
                            params: [{ name: "min", type: DTypes.resolve("Integer") }, { name: "max", type: DTypes.resolve("Integer") }],
                            isPseudomethod: true
                        },
                        "pi": {
                            name: "pi",
                            cname: "Daisy::math::pi",
                            returnType: DTypes.resolve("Float"),
                            params: [],
                            isPseudomethod: true
                        },
                    }
                }, const: true
            },
            io: {
                kind: "class", type: {
                    properties: {},
                    name: "io",
                    methods: {
                        "print": {
                            name: "print",
                            cname: "Daisy::builtin::io::print",
                            params: [{ name: "value", type: { kind: "any" } }],
                            returnType: DTypes.resolve("None"),
                            minParams: 0,
                            variadic: true,
                            isPseudomethod: true,
                        },
                        "prompt": {
                            name: "prompt",
                            cname: "Daisy::builtin::io::prompt",
                            params: [{ name: "value", type: { kind: "any" } }],
                            returnType: DTypes.resolve("String"),
                            minParams: 0,
                            variadic: true,
                            isPseudomethod: true
                        },
                    }
                }, const: true
            }
        },
        functions: {
            print: { kind: "function", type: BUILTIN_FUNCTIONS.print },
            sleep_ms: { kind: "function", type: BUILTIN_FUNCTIONS.sleep_ms },
            toInteger: { kind: "function", type: BUILTIN_FUNCTIONS.toInteger },
            toFloat: { kind: "function", type: BUILTIN_FUNCTIONS.toFloat },
            timeout_ms: { kind: "function", type: BUILTIN_FUNCTIONS.timeout_ms },
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

    inGlobalScope(): boolean {
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
                // wrapped is already encoded in param.type - no separate markShared needed
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

    variable_exists_local(name: string): boolean {
        const scope = this.stack.at(-1) ?? this.globals;
        return name in scope.variables;
    }

    variable_isSharedAcrossThreads(name: string): boolean {
        return this.variable_find(name).wrapType == 'shared';
    }

    variable_isSharedLocally(name: string): boolean {
        return this.variable_find(name).wrapType == 'local';
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
