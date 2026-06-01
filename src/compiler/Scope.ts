import { DTypes } from "./DTypes";

type ScopeInfo = DTypes.Function;
type ScopeEntry = {info?: ScopeInfo, variables: Record<string, DTypes.Type>, functions: Record<string, DTypes.Type>};

const BUILTIN_FUNCTIONS: Record<string, DTypes.Function> = {
    send: {
        name: "send",
        cname: "__DAISY_channel.send",
        params: [{ name: "msg", type: { kind: "primitive", type: DTypes.Primitive.String } }],
        returnType: { kind: "primitive", type: DTypes.Primitive.None },
        minParams: 0
    },
    receive: {
        name: "receive",
        cname: "__DAISY_channel.receive",
        params: [],
        returnType: { kind: "primitive", type: DTypes.Primitive.String }
    },
    print: {
        name: "print",
        cname: "Daisy::Print",
        params: [{ name: "value", type: { kind: "any" } as any }],
        returnType: { kind: "primitive", type: DTypes.Primitive.None }
    }
};

export class Scope
{

    private globals: ScopeEntry = {
        variables: {},
        functions: {
            print: { kind: "function", type: BUILTIN_FUNCTIONS.print }
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
            func.params.forEach(param => this.variable_mark(param));

            this.function_mark("send", BUILTIN_FUNCTIONS.send);
            this.function_mark("receive", BUILTIN_FUNCTIONS.receive);
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

        throw new Error(`Function '${name}' not found`);
    }

    function_getName(func: DTypes.Function): string
    {
        return func.cname ?? func.name;
    }

    variable_mark(info: DTypes.TypedValue, global: boolean = false): void
    {
        if(global)
        {
            this.globals.variables[info.name] = info.type;  // @todo prototype pullution
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

        throw new Error(`Variable '${name}' not found`);
    }
};