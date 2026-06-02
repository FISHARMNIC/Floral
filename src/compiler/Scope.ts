import { DTypes } from "./DTypes";
import { DSError } from "./DSError";

type ScopeInfo = DTypes.Function;
type ScopeEntry = {info?: ScopeInfo, variables: Record<string, DTypes.Type>, functions: Record<string, DTypes.Type>};

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
        params: [{ name: "value", type: { kind: "any" }}],
        returnType: DTypes.resolve("None"),
        minParams: 0,
        variadic: true,
    },
    sleep_ms: {
        name: "sleep_ms",
        cname: "Daisy::Timing::sleep_ms",
        params: [{ name: "value", type: DTypes.resolve("Integer")}],
        returnType: DTypes.resolve("None")
    },
};

export class Scope
{

    private globals: ScopeEntry = {
        variables: {},
        functions: {
            print: { kind: "function", type: BUILTIN_FUNCTIONS.print },
            sleep_ms: { kind: "function", type: BUILTIN_FUNCTIONS.sleep_ms }
        }
    };
    private stack: ScopeEntry[] = [];

    enter(info?: ScopeInfo): void
    {
        this.stack.push({info, variables: {}, functions: {}});
    }

    exit(): void
    {
        this.stack.pop();
    }

    findParentScope(type?: ScopeInfo): ScopeEntry | undefined
    {
        if(type)
        {
            for(let i = 1; i <= this.stack.length; i++)
            {
                const entry = this.stack.at(-i);
                if(entry?.info === type)
                {
                    return entry;
                }
            }
        }
        return this.stack.at(-1);
    }

    function_mark(name: string, func: DTypes.Function, scopeit: boolean = false)
    {
        const variables = this.stack.at(-1) ?? this.globals;
        variables.functions[name] = { kind: "function", type: func };

        if(scopeit)
        {
            this.enter(func);
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

    function_find(name: string): DTypes.Function
    {
        for(let i = 1; i <= this.stack.length; i++)
        {
            const entry = this.stack.at(-i)!;
            if(name in entry.functions)
            {
                const type = entry.functions[name];
                if(type.kind === "function")
                {
                    return type.type;
                }
            }
        }

        const globalFunc = this.globals.functions[name];
        if(globalFunc?.kind === "function")
        {
            return globalFunc.type;
        }

        throw new DSError(`Function '${name}' not found`);
    }

    function_getName(func: DTypes.Function): string
    {
        return func.cname ?? func.name;
    }

    variable_mark(info: DTypes.TypedValue, global: boolean = false): void
    {
        if(global)
        {
            this.globals.variables[info.name] = info.type;  // @todo prototype pollution
        }
        else
        {
            const scope = this.stack.at(-1) ?? this.globals;
            scope.variables[info.name] = info.type;
        }
    }

    variable_find(name: string): DTypes.Type
    {
        for(let i = 1; i <= this.stack.length; i++)
        {
            let level = this.stack.at(-i)!.variables;
            if(name in level)
            {
                return level[name];
            }
        }

        const globalVar = this.globals.variables[name];
        if (globalVar) {
            return globalVar;
        }

        throw new DSError(`Variable '${name}' not found`);
    }

    variable_isShared(name: string): boolean
    {
        return this.variable_find(name).wrapped === true;
    }
};
