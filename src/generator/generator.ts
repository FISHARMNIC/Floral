// @todo move out specific strings into proper namespace like instead of raw Daisy::List it should be Gen.Daisy.List
// @todo some kind of marker that something should be in global code instead of just having walker and globalCode handler it

import { DTypes } from "../compiler/DTypes";
import { DSError } from "../compiler/DSError";
import { RemoveType, TypeString } from "../compiler/walker";

// export function StringifyType(type: DTypes.Type): string {
//     if (DTypes.isPrimitive(type)) return type.type.replace('Daisy::', '');
//     if (DTypes.isList(type)) return `List<${StringifyType(type.type.itemType)}>`;
//     if (DTypes.isClass(type)) return type.type.name;
//     if (DTypes.isStruct(type)) return type.type.name;
//     if (DTypes.isAny(type)) return 'any';
//     if (type.kind === 'function') {
//         const params = type.type.params.map(p => StringifyType(p.type)).join(', ');
//         return `(${params}) -> ${StringifyType(type.type.returnType)}`;
//     }
//     return JSON.stringify(type);
// }

export function StringifyType(type: DTypes.Type): string {
    let res = "";
    if (DTypes.isPrimitive(type)) res = type.type.replace('Daisy::', '');
    if (DTypes.isList(type)) res = `List<${StringifyType(type.type.itemType)}>`;
    if (DTypes.isClass(type)) res = type.type.name;
    if (DTypes.isStruct(type)) res = type.type.name;
    if (DTypes.isAny(type)) res = 'any';
    if (type.kind === 'function') {
        const params = type.type.params.map(p => StringifyType(p.type)).join(', ');
        res = `(${params}) -> ${StringifyType(type.type.returnType)}`;
    }

    const wasFound = res != "";

    if (type.wrapType === "shared") {
        res = "shared " + res
    }

    // console.log(res, type)

    return wasFound? res : JSON.stringify(type);
}


export function CompareTypes(actual: DTypes.Type, expected: DTypes.Type): boolean {
    if (DTypes.isAny(expected) || DTypes.isAny(actual)) return true;
    if (actual.kind !== expected.kind) return false;
    if (actual.kind === "function" && expected.kind === "function") {
        const ap = actual.type.params, ep = expected.type.params;
        if (ap.length !== ep.length) return false;
        if (!ap.every((p, i) => CompareTypes(p.type, ep[i].type))) return false;
        return CompareTypes(actual.type.returnType, expected.type.returnType);
    }
    const stripWrapped = (t: DTypes.Type) => { const { wrapped, wrapType, ...rest } = t as any; return rest; };
    const matchesDirectly = StringifyType(stripWrapped(actual)) === StringifyType(stripWrapped(expected));
    const matchesCast: boolean = expected.autoCasts != undefined && expected.autoCasts.includes(actual);

    return matchesCast || matchesDirectly;
}

export function CheckArgumentTypes(args: DTypes.TypedValue[], params: DTypes.TypedValue[], context: string, variadic: boolean = false): void {
    const checkCount = variadic ? Math.min(args.length, params.length) : args.length;
    for (let i = 0; i < checkCount; i++) {
        const arg = args[i];
        const param = params[i];

        if (!CompareTypes(arg.type, param.type)) {
            throw new DSError(`Argument ${i + 1} of '${context}': expected ${StringifyType(param.type)}, got ${StringifyType(arg.type)}`);
        }

        if (param.type.wrapType === "shared" && arg.type.wrapType !== "shared") {
            const typeName = DTypes.isPrimitive(param.type) ? param.type.type.replace('Daisy::', '') : StringifyType(param.type);
            throw new DSError(`Argument ${i + 1} of '${context}': parameter expects a shared type ($${typeName}), but '${arg.name}' is not shared`);
        }
    }
}

export function Unwrap(value: DTypes.TypedValue): string {
    if (value.type.wrapType === "shared") return `${value.name}->get()`;
    if (value.type.wrapType === "local") return `${value.name}.get()`;
    if (!value.type.pureCppClass && (DTypes.isStruct(value.type) || DTypes.isList(value.type))) return `${value.name}.get()`;
    return value.name;
}

export namespace Generator {

    export namespace Types {
        export function createStruct(struct: DTypes.Struct): string
        {
            return `\nexport struct ${struct.name} {
            ${Object.entries(struct.properties).map(x => `${DTypes.toCpp(x[1])} ${x[0]};`).join("\n")}
            };\n`
        }

        export function instanceStruct(struct: Extract<DTypes.Type, { kind: "struct" }>, given: {name: string, value: DTypes.TypedValue}[]): DTypes.TypedValue
        {
            const structExpr = `((${struct.type.name}){${given.map(x => `.${x.name} = ${x.value.name}`).join(",")}})`;
            const localType: DTypes.Type = { ...struct, wrapType: "local" };
            return TypeString(localType, `Daisy::_Local<${struct.type.name}>(${structExpr})`);
        }

    }

    export namespace Variables {
        export function create(name: string, value: DTypes.TypedValue, declaredType?: DTypes.Type): DTypes.TypedValue {
            const target = declaredType ?? value.type;
            const raw = Unwrap(value);

            let wrappedValue: string;
            if (target.wrapType === "shared") {
                wrappedValue = value.type.wrapType === "shared" ? value.name : `Daisy::NewShared(${raw})`;
            } else if (target.wrapType === "local" && (DTypes.isStruct(target) || DTypes.isList(target))) {
                wrappedValue = value.type.wrapType === "local" ? value.name : `${DTypes.toCpp(target)}(${raw})`;
            } else {
                wrappedValue = raw;
            }

            return TypeString(target, `auto ${name} = ${wrappedValue};\n`);
        }

        export function declareGlobal(name: string, value: DTypes.TypedValue, declaredType: DTypes.Type): { forward: string; assign: string } | null {
            const cppType = DTypes.toCpp(declaredType);
            if (cppType === "auto") return null;

            const decl = create(name, value, declaredType);
            const eqIdx = decl.name.indexOf('=');
            const semiIdx = decl.name.lastIndexOf(';');
            const initExpr = decl.name.slice(eqIdx + 1, semiIdx).trim();

            return {
                forward: `export ${cppType} ${name} = {};\n`,
                assign: `${name} = ${initExpr};\n`,
            };
        }

        export function read(name: string, type: DTypes.Type): DTypes.TypedValue {
            return TypeString(type, name);
        }
    }

    export namespace Statements {
        export function return_(expr: DTypes.TypedValue): DTypes.TypedValue {
            const code = `return ${expr.name};\n`;
            return TypeString(expr.type, code);
        }

        export function expressionStatement(expr: DTypes.TypedValue): DTypes.TypedValue {
            const endsWithSemicolon = expr.name.endsWith(';\n') || expr.name.endsWith(';');
            const code = endsWithSemicolon ? `${expr.name}${expr.name.endsWith('\n') ? '' : '\n'}` : `${expr.name};\n`;
            return TypeString(expr.type, code);
        }

        export function assignment(target: string, value: DTypes.TypedValue, targetType: DTypes.Type): DTypes.TypedValue {
            const raw = Unwrap(value);
            if (targetType.wrapType === "shared") {
                const lambdaBody = raw.replaceAll(`${target}->get()`, `__v`);
                return TypeString(value.type, `${target}->modify([&](auto __v){ return ${lambdaBody}; });\n`);
            }
            if (targetType.wrapType === "local" && (DTypes.isStruct(targetType) || DTypes.isList(targetType))) {
                return TypeString(value.type, `${target}.get() = ${raw};\n`);
            }
            return TypeString(value.type, `${target} = ${raw};\n`);
        }

        export function while_(condition: DTypes.TypedValue, body: string): DTypes.TypedValue {
            const code = `while (${condition.name}) {\n${body}}\n`;
            return TypeString({ kind: "primitive", type: DTypes.Primitive.None }, code);
        }

        export function if_(condition: DTypes.TypedValue, thenBody: string, elifBranches: Array<{ condition: DTypes.TypedValue, body: string }>, elseBody?: string): DTypes.TypedValue {
            let code = `if (${condition.name}) {\n${thenBody}}\n`;

            for (const elifBranch of elifBranches) {
                code += `else if (${elifBranch.condition.name}) {\n${elifBranch.body}}\n`;
            }

            if (elseBody) {
                code += `else {\n${elseBody}}\n`;
            }

            return TypeString({ kind: "primitive", type: DTypes.Primitive.None }, code);
        }

        export function break_(): DTypes.TypedValue {
            return TypeString({ kind: "primitive", type: DTypes.Primitive.None }, "break;\n");
        }
    }

    export namespace Expressions {

        export function interpolateString(builder: (string | DTypes.TypedValue)[]): DTypes.TypedValue
        {
            const res = builder.map(x => typeof x == 'string'? stringLiteral(x).name : `Daisy::util::toString(${x.name})`).join(" + ")
            return TypeString(DTypes.resolve("String"), `(${res})`);
        }

        export function binaryOp(left: DTypes.TypedValue, op: string, right: DTypes.TypedValue): DTypes.TypedValue {
            const leftExpr = Unwrap(left);
            const rightExpr = Unwrap(right);
            const code = `${leftExpr} ${op} ${rightExpr}`;
            const isCmp = ['==','!=','<','>','<=','>='].includes(op);
            if (isCmp) return TypeString(DTypes.resolve("Bool"), code);
            const { wrapped, wrapType, ...leftStripped } = left.type as any;
            const { wrapped: _w, wrapType: _wt, ...rightStripped } = right.type as any;
            const resultType = DTypes.isFloat(right.type) ? rightStripped : leftStripped;
            return TypeString(resultType, code);
        }

        export function methodCall(object: DTypes.TypedValue, method: DTypes.Function, args: DTypes.TypedValue[], methodDef: DTypes.Function): DTypes.TypedValue {
            const argsStr = (RemoveType(args) as string[]).join(", ");
            if (method.isPseudomethod) {
                if (method.cname) {
                    const code = `${method.cname}(${argsStr})`;
                    return TypeString(methodDef.returnType, code);
                } else {
                    // Imported user-defined function - needs SlaveChannel via Daisy::Threads::call
                    const code = `Daisy::Threads::call(${method.name}${argsStr.length ? `, ${argsStr}` : ''})`;
                    return TypeString(methodDef.returnType, code);
                }
            }
            else {
                const code = `${object.name}.${method.cname ?? method.name}(${argsStr})`;
                return TypeString(methodDef.returnType, code);
            }
        }

        export function propertyAccess(object: DTypes.TypedValue, field: string, type: DTypes.Type, setterValue?: DTypes.TypedValue): DTypes.TypedValue
        {
            const obj = RemoveType(object);
            const wrapType = object.type.wrapType;
            const isWrappedLocal = wrapType === "local" || (
                !wrapType && !object.type.pureCppClass &&
                (DTypes.isStruct(object.type) || DTypes.isList(object.type))
            );
            const accessor = wrapType === "shared" ? `${obj}->value.${field}`
                           : isWrappedLocal        ? `${obj}.get().${field}`
                           : `${obj}.${field}`;

            if (setterValue) {
                if (wrapType === "shared") {
                    const typeName = (object.type as any).type.name;
                    return TypeString(DTypes.resolve("None"), `${obj}->setProperty(&${typeName}::${field}, [&](auto __v){ return ${RemoveType(setterValue)}; });\n`);
                }
                return TypeString(DTypes.resolve("None"), `${accessor} = ${RemoveType(setterValue)};\n`);
            }

            return TypeString(type, accessor);
        }

        export function await_(expression: DTypes.TypedValue): DTypes.TypedValue {
            let returnType: DTypes.Type = { kind: "primitive", type: DTypes.Primitive.None };

            if (DTypes.isClass(expression.type) && expression.type.type.methods?.await) {
                returnType = expression.type.type.methods.await.returnType;
            }

            const code = `${expression.name}.await()`;
            return TypeString(returnType, code);
        }

        export function lambda(params: { name: string; type?: DTypes.Type }[], body: DTypes.TypedValue): DTypes.TypedValue {
            const paramList = params.map(p => `auto ${p.name}`).join(', ');
            const fnType: DTypes.Type = {
                kind: "function",
                type: {
                    name: "lambda",
                    params: params.map(p => ({ name: p.name, type: p.type ?? { kind: "any" } as DTypes.Type })),
                    returnType: body.type
                }
            };
            return TypeString(fnType, `[&](${paramList}){ return ${body.name}; }`);
        }

        export function floatLiteral(value: number): DTypes.TypedValue {
            const code = `static_cast<${DTypes.Primitive.Float}>(${value})`;
            return TypeString(DTypes.resolve("Float"), code);
        }

        export function integerLiteral(value: number): DTypes.TypedValue {
            const code = `static_cast<${DTypes.Primitive.Integer}>(${value})`;
            return TypeString(DTypes.resolve("Integer"), code);
        }

        export function stringLiteral(value: string): DTypes.TypedValue {
            const code = `"${value}"`; // @todo escape quotes in string maybe
            return TypeString(DTypes.resolve("String"), code);
        }

        export function arrayLiteral(entries: DTypes.TypedValue[]): DTypes.TypedValue {
            const itemType = entries[0].type;
            const inner = DTypes.toCpp(itemType);
            const elems = entries.map(x => RemoveType(x)).join(", ");
            const code = `Daisy::LocalList<${inner}>(Daisy::List<${inner}>{${elems}})`;
            const listType: DTypes.Type = { ...DTypes.resolveGeneric("List", itemType), wrapType: "local" };
            return TypeString(listType, code);
        }

        export function arrayIndex(object: DTypes.TypedValue, itemType: DTypes.Type, index: DTypes.TypedValue, setterValue?: DTypes.TypedValue): DTypes.TypedValue {
            if (setterValue) {
                if (object.type.wrapType === "shared") {
                    const code = `${RemoveType(object)}->setAt(${Unwrap(index)}, [&](auto __v){ return ${RemoveType(setterValue)}; });`;
                    return TypeString(DTypes.resolve("None"), code);
                }
                else {
                    const code = `${Unwrap(object)}[${Unwrap(index)}] = ${RemoveType(setterValue)};`;
                    return TypeString(DTypes.resolve("None"), code);
                }
            }
            else {
                const objectCode = Unwrap(object);
                const indexCode = Unwrap(index);
                const code = `${objectCode}[${indexCode}]`;

                return TypeString(itemType, code);
            }
        }
    }

    export namespace Functions {
         export function create(func: DTypes.Function): string {
            const returnType = DTypes.toCpp(func.returnType);
            const params = func.params
                .map(p => `${DTypes.toCppTypedValue(p)}`)
                .join(", ");
            return `DAISY_FUNCTION(${returnType}, ${func.name}, ${params})\n`;
        }

        export function end(): string {
            return "\n}\n";
        }

        export function call(func: DTypes.Function, args: DTypes.TypedValue[]): DTypes.TypedValue {
            const argsStr = (RemoveType(args) as string[]).join(", ");
            // Use cname if available (built-in functions), otherwise wrap user-defined with Daisy::Threads::call
            const callExpr = func.cname ? `${func.cname}(${argsStr})` : `Daisy::Threads::call(${func.name} ${argsStr.length == 0 ? "" : ","} ${argsStr})`;
            return TypeString(func.returnType, callExpr);
        }

        export function spawn(func: DTypes.Function, args: DTypes.TypedValue[]): DTypes.TypedValue {
            const handlerType = DTypes.resolveGeneric("Handler", func.returnType);
            const argsStr = (RemoveType(args) as string[]).join(", ");

            if (func.cname) {
                // Builtin/pseudomethod: doesn't accept SlaveChannel - wrap in a capturing lambda
                return TypeString(handlerType, `Daisy::Threads::spawn([=](auto __ch){ return ${func.cname}(${argsStr}); })`);
            }

            return TypeString(handlerType, `Daisy::Threads::spawn(${func.name}${argsStr.length === 0 ? "" : `, ${argsStr}`})`);
        }

        export function threadCall(func: DTypes.Function, args: DTypes.TypedValue[]): DTypes.TypedValue {
            const argsStr = (RemoveType(args) as string[]).join(", ");
            return TypeString(func.returnType, `Daisy::Threads::call(${func.name}, ${argsStr})`);
        }
    }
}
