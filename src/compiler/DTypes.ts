// @todo clean up each primitive is defined like 1000 times throughout this file

import { StringifyType } from "../generator/generator";
import { DSError } from "./DSError";

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
    // const: true means this variable is immutable - no mutation warnings emitted for globals
    export type Type = TypeBase & { wrapped?: boolean, const?: boolean };

    export type TypedValue = { name: string, type: Type, isGlobal?: boolean };
    export type MarkedFunctions = Record<string, Function>;
    export type MarkedTypes = Record<string, Type>;

    export type Function<T extends Type = Type> = {
        returnType: T,
        params: TypedValue[],
        name: string,
        cname?: string,
        isPseudomethod?: boolean,
        minParams?: number,
        variadic?: boolean,
        inferReturnType?: (objectType: Type, lambdaReturnType: Type) => Type,
        inferReturnTypeFromSelf?: (objectType: Type) => Type,
        inferReturnTypeFromArgs?: (args: TypedValue[]) => Type,
    };

    export type Struct = {
        properties: MarkedTypes,
        name: string
    };

    export type Class = {
        properties: MarkedTypes,
        name: string,
        methods: MarkedFunctions
    };

    export type List = {
        itemType: Type
    };

    export type GenericFactory = (t: Type) => Type;

    // internal registries
    const _declared: MarkedTypes = {
        "Integer": { kind: "primitive", type: Primitive.Integer },
        "String": { kind: "primitive", type: Primitive.String },
        "Float": { kind: "primitive", type: Primitive.Float },
        "Bool": { kind: "primitive", type: Primitive.Bool },
        "None": { kind: "primitive", type: Primitive.None },
    };

    const _generics: Record<string, GenericFactory> = {
        // Handler is always wrapped - it's a class that owns a future+channel
        "Handler": (t: Type) => ({
            kind: "class",
            wrapped: true,
            type: {
                name: `Daisy::Threads::Handler<${toCpp(t)}>`,
                properties: {},
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
        }),
        "TimeoutResponse": (t: Type) => ({
            kind: "struct" as const,
            type: {
                name: `Daisy::Timing::TimeoutResponse<${toCpp(t)}>`,
                properties: {
                    "fail": resolve("Bool"),
                    "res": t
                }
            }
        }),
        "Signal": (t: Type) => ({
            kind: "class" as const,
            type: {
                name: `Daisy::Signal<${toCpp(t)}>`,
                properties: {},
                methods: {
                    "wait": {
                        name: "wait",
                        params: [],
                        returnType: t,
                        minParams: 0
                    },
                    "notify": {
                        name: "notify",
                        params: [{name: "nv", type: t}],
                        returnType: resolve("None"),
                        minParams: 0
                    },
                }
            }
        })
    };

    const _pseudoMethods: Record<string, MarkedFunctions | Record<string, MarkedFunctions>> = {
        "primitive": {
            [Primitive.Integer]: {
                "toString": {
                    name: "toString",
                    cname: "Daisy::util::toString",
                    params: [{ name: "self", type: resolve("Integer") }],
                    returnType: resolve("String"),
                    isPseudomethod: true
                },
                "toFloat": {
                    name: "toFloat",
                    cname: "Daisy::util::toFloat",
                    params: [{ name: "self", type: resolve("Integer") }],
                    returnType: resolve("Float"),
                    isPseudomethod: true
                },
            },
            [Primitive.Float]: {
                "toString": {
                    name: "toString",
                    cname: "Daisy::util::toString",
                    params: [{ name: "self", type: resolve("Float") }],
                    returnType: resolve("String"),
                    isPseudomethod: true
                },
                "toInteger": {
                    name: "toInteger",
                    cname: "Daisy::util::toInteger",
                    params: [{ name: "self", type: resolve("Float") }],
                    returnType: resolve("Integer"),
                    isPseudomethod: true
                },
            },
            [Primitive.Bool]: {
                "toString": {
                    name: "toString",
                    cname: "Daisy::util::toString",
                    params: [{ name: "self", type: resolve("Bool") }],
                    returnType: resolve("String"),
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
                    minParams: 2,
                    returnType: resolve("String"),
                    isPseudomethod: true
                },
                "indexOf": {
                    name: "indexOf",
                    cname: "Daisy::util::strindexof",
                    params: [{ name: "self", type: resolve("String") }, { name: "find", type: resolve("String") }],
                    returnType: resolve("Integer"),
                    isPseudomethod: true
                },
                "at": {
                    name: "at",
                    cname: "Daisy::util::strat",
                    params: [{ name: "self", type: resolve("String") }, { name: "i", type: resolve("Integer") }],
                    returnType: resolve("String"),
                    isPseudomethod: true
                },
                "toString": {
                    name: "toString",
                    cname: "Daisy::util::toString",
                    params: [{ name: "self", type: resolve("String") }],
                    returnType: resolve("String"),
                    isPseudomethod: true
                },
                "toInteger": {
                    name: "toInteger",
                    cname: "Daisy::util::toInteger",
                    params: [{ name: "self", type: resolve("String") }],
                    returnType: resolve("Integer"),
                    isPseudomethod: true
                },
                "toFloat": {
                    name: "toFloat",
                    cname: "Daisy::util::toFloat",
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
                inferReturnType: (_self: Type, lambdaRet: Type) => resolveGeneric("List", lambdaRet)
            },
            "forEach": {
                name: "forEach",
                cname: "Daisy::util::listfeach",
                params: [
                    { name: "self", type: { kind: "any" } },
                    { name: "fn", type: { kind: "function", type: { name: "callback", params: [{ name: "item", type: { kind: "any" } }], returnType: resolve("None") } } }],
                returnType: resolve("None"),
                isPseudomethod: true,
                inferReturnType: (_self: Type, lambdaRet: Type) => resolveGeneric("List", lambdaRet)
            },
            // "find": {
            //     name: "find",
            //     cname: "Daisy::util::listjoin",
            //     params: [{ name: "self", type: { kind: "any" } }, { name: "find", type: resolve("String") }],
            //     returnType: resolve("String"),
            //     isPseudomethod: true
            // },
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
            },
            "push": {
                name: "push",
                cname: "Daisy::util::listpush",
                params: [{ name: "self", type: { kind: "any" } }, { name: "item", type: { kind: "any" } }],
                returnType: resolve("None"),
                isPseudomethod: true
            },
            "pop": {
                name: "pop",
                cname: "Daisy::util::listpop",
                params: [{ name: "self", type: { kind: "any" } }],
                returnType: { kind: "any" },
                isPseudomethod: true,
                inferReturnTypeFromSelf: (self: Type) => isList(self) ? self.type.itemType : { kind: "any" }
            },
            "pushFront": {
                name: "pushFront",
                cname: "Daisy::util::listpushFront",
                params: [{ name: "self", type: { kind: "any" } }, { name: "item", type: { kind: "any" } }],
                returnType: resolve("None"),
                isPseudomethod: true
            },
            "popFront": {
                name: "popFront",
                cname: "Daisy::util::listpopFront",
                params: [{ name: "self", type: { kind: "any" } }],
                returnType: { kind: "any" },
                isPseudomethod: true,
                inferReturnTypeFromSelf: (self: Type) => isList(self) ? self.type.itemType : { kind: "any" }
            },
            "delete": {
                name: "delete",
                cname: "Daisy::util::listdelete",
                params: [{ name: "self", type: { kind: "any" } }, { name: "index", type: resolve("Integer") }],
                returnType: resolve("None"),
                isPseudomethod: true
            }
        }
    }

    export function getProperties(type: Type): MarkedTypes
    {
        if(type.kind != 'struct' && type.kind != 'class')
        {
            throw new DSError(`Type "${StringifyType(type)}" does not have any properties`)
        }
        else
        {
            return type.type.properties;
        }
    }

    export function declare(name: string, type: Type) {
        _declared[name] = type;
    }

    export function reset() { // @todo cleanup
        for (const key of Object.keys(_declared)) {
            if (!["Integer", "Int", "String", "Float", "Bool", "Boolean", "None"].includes(key)) {
                delete _declared[key];
            }
        }
    }

    export function declareGeneric(name: string, factory: GenericFactory) {
        if(name in _generics)
        {
            throw new DSError(`Generic "${name}" is already declared`)
        }
        _generics[name] = factory;
    }

    export function resolve(name: string): Type {
        const resolved = _declared[name];
        if (!resolved) {
            if (_generics[name]) {
                throw new Error(`Type "${name}" is a template`);
            }
            // Unknown - forward-reference; walker validates after TypeDef is processed
            return { kind: "struct", type: { name, properties: {} } };
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
        if (isStruct(type)) {
            return type.wrapped ? `Daisy::_Shared<${type.type.name}>` : type.type.name;
        }
        if (isClass(type)) {
            return type.type.name;
        }
        if (isFunction(type)) {
            const ret = toCpp(type.type.returnType);
            const params = type.type.params.map(p => toCpp(p.type)).join(', ');
            return `std::function<${ret}(${params})>`;
        }
        return "auto";
    }

    export function toCppTypedValue(value: TypedValue): string {
        return `${toCpp(value.type)} ${value.name}`;
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
