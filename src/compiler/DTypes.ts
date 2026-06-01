export namespace DTypes {

    export enum Primitive {
        Integer = `Daisy::Integer`,
        String = `Daisy::String`,
        Float = `Daisy::Float`,
        None = `void`
    };

    export type TypedValue = { name: string, type: Type, isGlobal?: boolean, wrapped?: boolean };
    export type MarkedFunctions = Record<string, Function>;

    export type Function<T extends Type = Type> = {
        returnType: T,
        params: TypedValue[],
        name: string,
        cname?: string,
        minParams?: number,
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

    export type Type =
        | { kind: "function", type: Function }
        | { kind: "struct", type: Struct }
        | { kind: "primitive", type: Primitive }
        | { kind: "class", type: Class }
        | { kind: "any" }

    export type GenericFactory = (t: Type) => Type;

    // internal registries
    const _declared: Record<string, Type> = {
        "Integer": { kind: "primitive", type: Primitive.Integer },
        "String": { kind: "primitive", type: Primitive.String },
        "None": { kind: "primitive", type: Primitive.None },
    };

    const _generics: Record<string, GenericFactory> = {
        "Handler": (t: Type) => ({
            kind: "class",
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
                        params: [{ name: "msg", type: { kind: "primitive", type: Primitive.String } }],
                        returnType: { kind: "primitive", type: Primitive.None },
                        minParams: 0
                    },
                    "receive": {
                        name: "receive",
                        params: [],
                        returnType: { kind: "primitive", type: Primitive.String }
                    }
                }
            }
        })
    };

    export function declare(name: string, type: Type) {
        _declared[name] = type;
    }

    export function declareGeneric(name: string, factory: GenericFactory) {
        _generics[name] = factory;
    }

    export function resolve(name: string): Type {
        const resolved = _declared[name];
        if(!resolved)
        {
            throw new Error(`Unknown type "${name}"`);
        }
        return resolved;
    }

    export function resolveGeneric(name: string, t: Type): Type {
        const resolved = _generics[name]?.(t);
        if(!resolved)
        {
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

    export function isAny(type: Type): type is { kind: "any" } {
        return type.kind === "any";
    }

    export function isClass(type: Type): type is { kind: "class"; type: Class } {
        return type.kind === "class";
    }

    export function toCpp(type: Type): string {
        if (isPrimitive(type)) {
            return type.type;
        }
        return JSON.stringify(type);
    }
}