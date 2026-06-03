// @todo clean up each primitive is defined like 1000 times throughout this file

export namespace DTypes {

    export enum Primitive {
        // Raw (unwrapped) types
        Integer = `Daisy::Integer`,
        String = `Daisy::String`,
        Float = `Daisy::Float`,
        Bool = `Daisy::Bool`,
        None = `void`
    };

    export enum SharedPrimitive {
        Integer = `Daisy::SharedInteger`,
        String = `Daisy::SharedString`,
        Float = `Daisy::SharedFloat`,
        Bool = `Daisy::SharedBool`
    };

    type TypeBase =
        | { kind: "function", type: Function }
        | { kind: "struct", type: Struct }
        | { kind: "primitive", type: Primitive }
        | { kind: "class", type: Class }
        | { kind: "any" }
        | { kind: "list", type: List }

    // wrapped: true means this value requires ->get() to read
    // const: true means this variable is immutable — no mutation warnings emitted for globals
    export type Type = TypeBase & { wrapped?: boolean, const?: boolean };

    export type TypedValue = { name: string, type: Type, isGlobal?: boolean };
    export type MarkedFunctions = Record<string, Function>;

    export type Function<T extends Type = Type> = {
        returnType: T,
        params: TypedValue[],
        name: string,
        cname?: string,
        isPseudomethod?: boolean,
        minParams?: number,
        variadic?: boolean,
        inferReturnType?: (objectType: Type, lambdaReturnType: Type) => Type,
    };

    export type Struct = {
        properties: TypedValue[],
        name: string
    };

    export type Class = {
        properties: TypedValue[],
        name: string,
        methods: MarkedFunctions
    };

    export type List = {
        itemType: Type
    };

    export type GenericFactory = (t: Type) => Type;

    // internal registries
    const _declared: Record<string, Type> = {
        "Integer": { kind: "primitive", type: Primitive.Integer },
        "String": { kind: "primitive", type: Primitive.String },
        "Float": { kind: "primitive", type: Primitive.Float },
        "Bool": { kind: "primitive", type: Primitive.Bool },
        "None": { kind: "primitive", type: Primitive.None },
    };

    const _generics: Record<string, GenericFactory> = {
        // Handler is always wrapped — it's a class that owns a future+channel
        "Handler": (t: Type) => ({
            kind: "class",
            wrapped: true,
            type: {
                name: "Handler",
                properties: [],
                methods: {
                    "await": {
                        name: "await",
                        params: [],
                        returnType: t
                    },
                    "send": {
                        name: "send",
                        params: [{ name: "msg", type: resolve("String") }],
                        returnType: resolve("None"),
                        minParams: 0
                    },
                    "receive": {
                        name: "receive",
                        params: [],
                        returnType: resolve("String")
                    },
                    "done": {
                        name: "done",
                        params: [],
                        returnType: resolve("Bool")
                    },
                    "canReceive": {
                        name: "canReceive",
                        params: [],
                        returnType: resolve("Bool")
                    },
                    "pending": {
                        name: "pending",
                        params: [],
                        returnType: resolve("Integer")
                    }
                }
            }
        }),
        // List is not inherently shared
        "List": (t: Type) => ({
            kind: "list",
            type: {
                itemType: t
            }
        })
    };

    const _pseudoMethods: Record<string, MarkedFunctions | Record<string, MarkedFunctions>> = {
        "primitive": {
            [Primitive.Integer]: {
                "toString": {
                    name: "toString",
                    cname: "std::to_string",
                    params: [{ name: "self", type: resolve("Integer") }],
                    returnType: resolve("String"),
                    isPseudomethod: true
                },
                "toFloat": {
                    name: "toFloat",
                    cname: "Daisy::util::inttofloat",
                    params: [{ name: "self", type: resolve("Integer") }],
                    returnType: resolve("Float"),
                    isPseudomethod: true
                },
            },
            [Primitive.String]: {
                "split": {
                    name: "split",
                    cname: "Daisy::util::strsplit",
                    params: [{ name: "self", type: resolve("String") }, { name: "delim", type: resolve("String") }],
                    returnType: resolveGeneric("List", resolve("String")),
                    isPseudomethod: true
                },
                "length": {
                    name: "length",
                    cname: "Daisy::util::strlength",
                    params: [{ name: "self", type: resolve("String") }],
                    returnType: resolve("Integer"),
                    isPseudomethod: true
                },
                "slice": {
                    name: "slice",
                    cname: "Daisy::util::strslice",
                    params: [{ name: "self", type: resolve("String") }, { name: "start", type: resolve("Integer") }, { name: "end", type: resolve("Integer") }],
                    returnType: resolve("String"),
                    isPseudomethod: true
                },
                "at": {
                    name: "at",
                    cname: "Daisy::util::strat",
                    params: [{ name: "self", type: resolve("String") }, { name: "i", type: resolve("Integer") }],
                    returnType: resolve("String"),
                    isPseudomethod: true
                },
                "toInteger": {
                    name: "toInteger",
                    cname: "Daisy::util::strtoint",
                    params: [{ name: "self", type: resolve("String") }],
                    returnType: resolve("Integer"),
                    isPseudomethod: true
                },
                "toFloat": {
                    name: "toFloat",
                    cname: "Daisy::util::strtofloat",
                    params: [{ name: "self", type: resolve("String") }],
                    returnType: resolve("Float"),
                    isPseudomethod: true
                },
            },
        },
        "list": {
            "length": {
                name: "length",
                cname: "Daisy::util::listlength",
                params: [{ name: "self", type: { kind: "any" } }],
                returnType: resolve("Integer"),
                isPseudomethod: true
            },
            "join": {
                name: "join",
                cname: "Daisy::util::listjoin",
                params: [{ name: "self", type: { kind: "any" } }, { name: "sep", type: resolve("String") }],
                returnType: resolve("String"),
                isPseudomethod: true
            },
            "map": {
                name: "map",
                cname: "Daisy::util::listmap",
                params: [
                    { name: "self", type: { kind: "any" } },
                    { name: "fn", type: { kind: "function", type: { name: "callback", params: [{ name: "item", type: { kind: "any" } }], returnType: { kind: "any" } } } }],
                returnType: { kind: "any" },
                isPseudomethod: true,
                inferReturnType: (_self, lambdaRet) => resolveGeneric("List", lambdaRet)
            },
            "filter": {
                name: "filter",
                cname: "Daisy::util::listfilter",
                params: [
                    { name: "self", type: { kind: "any" } },
                    { name: "fn", type: { kind: "function", type: { name: "callback", params: [{ name: "item", type: { kind: "any" } }], returnType: { kind: "any" } } } }],
                returnType: { kind: "any" },
                isPseudomethod: true,
                inferReturnType: (self, _lambdaRet) => self  // preserves list type
            },
            "reduce": {
                name: "reduce",
                cname: "Daisy::util::listreduce",
                params: [
                    { name: "self", type: { kind: "any" } },
                    { name: "fn", type: { kind: "function", type: { name: "callback", params: [{ name: "acc", type: { kind: "any" } }, { name: "item", type: { kind: "any" } }], returnType: { kind: "any" } } } }],
                returnType: { kind: "any" },
                isPseudomethod: true,
                inferReturnType: (_self, lambdaRet) => lambdaRet
            }
        }
    }

    export function declare(name: string, type: Type) {
        _declared[name] = type;
    }

    export function declareGeneric(name: string, factory: GenericFactory) {
        _generics[name] = factory;
    }

    export function resolve(name: string): Type {
        const resolved = _declared[name];
        if (!resolved) {
            if (_generics[name]) {
                throw new Error(`Type "${name}" is a template`);
            }
            else {
                throw new Error(`Unknown type "${name}"`);
            }
        }
        return resolved;
    }

    export function resolveGeneric(name: string, t: Type): Type {
        const resolved = _generics[name]?.(t);
        if (!resolved) {
            throw new Error(`Unable to resolve generic "${name}" with type "${t}"`);
        }
        return resolved;
    }

    export function exists(name: string): boolean {
        return name in _declared || name in _generics;
    }

    export function isGeneric(name: string): boolean {
        return name in _generics;
    }

    export function isPrimitive(type: Type): type is { kind: "primitive"; type: Primitive } {
        return type.kind === "primitive";
    }

    export function isInteger(type: Type): boolean {
        return isPrimitive(type) && type.type === Primitive.Integer;
    }

    export function isString(type: Type): boolean {
        return isPrimitive(type) && type.type === Primitive.String;
    }

    export function isFloat(type: Type): boolean {
        return isPrimitive(type) && type.type === Primitive.Float;
    }

    export function isNone(type: Type): boolean {
        return isPrimitive(type) && type.type === Primitive.None;
    }

    export function isList(type: Type): type is { kind: "list"; type: List } {
        return type.kind === "list";
    }

    export function isStruct(type: Type): type is { kind: "struct"; type: Struct } {
        return type.kind === "struct";
    }

    export function isAny(type: Type): type is { kind: "any" } {
        return type.kind === "any";
    }

    export function isClass(type: Type): type is { kind: "class"; type: Class } {
        return type.kind === "class";
    }

    export function isFunction(type: Type): type is { kind: "function"; type: Function } {
        return type.kind === "function";
    }

    export function toCpp(type: Type): string {
        if (isPrimitive(type)) {
            if (type.wrapped) {
                const sharedMap: Record<string, string> = { // @todo cleanup
                    [Primitive.Integer]: SharedPrimitive.Integer,
                    [Primitive.String]: SharedPrimitive.String,
                    [Primitive.Float]: SharedPrimitive.Float,
                    [Primitive.Bool]: SharedPrimitive.Bool
                };
                return sharedMap[type.type] || type.type;
            }
            return type.type;
        }
        if (isList(type)) {
            const inner = toCpp(type.type.itemType);
            return type.wrapped ? `Daisy::SharedList<${inner}>` : `Daisy::List<${inner}>`;
        }
        if (isClass(type)) {
            // Classes (e.g. Handler) are always auto-typed at declaration
            return "auto";
        }
        return "auto";
    }

    export function toCppTypedValue(value: TypedValue): string {
        return toCpp(value.type);
    }

    export function getPseudomethods(type: Type): MarkedFunctions | undefined {
        if (type.kind == "any") {
            return undefined;
        }
        else if (type.kind == "primitive") {
            return _pseudoMethods[type.kind][type.type] as MarkedFunctions;
        }
        else {
            return _pseudoMethods[type.kind] as MarkedFunctions;
        }
    }
}
