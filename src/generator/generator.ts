// @todo move out specific strings into proper namespace like instead of raw Daisy::List it should be Gen.Daisy.List

import { DTypes } from "../compiler/DTypes";
import { DSError } from "../compiler/DSError";
import { RemoveType, TypeString } from "../compiler/walker";

export function StringifyType(type: DTypes.Type) {
    return JSON.stringify(type)
}


export function CompareTypes(actual: DTypes.Type, expected: DTypes.Type): boolean {
    // Check if either is "any" type
    if (DTypes.isAny(expected) || DTypes.isAny(actual)) {
        return true;
    }
    // Compare ignoring wrapped so $Integer and Integer are the same underlying type @todo are they tho?
    const stripWrapped = (t: DTypes.Type) => { const { wrapped, ...rest } = t as any; return rest; };
    return StringifyType(stripWrapped(actual)) === StringifyType(stripWrapped(expected));
}

export function CheckArgumentTypes(args: DTypes.TypedValue[], params: DTypes.TypedValue[], context: string, variadic: boolean = false): void {
    const checkCount = variadic ? Math.min(args.length, params.length) : args.length;
    for (let i = 0; i < checkCount; i++) {
        const arg = args[i];
        const param = params[i];

        if (!CompareTypes(arg.type, param.type)) {
            throw new DSError(`Argument ${i + 1} of '${context}': expected ${StringifyType(param.type)}, got ${StringifyType(arg.type)}`);
        }

        if (param.type.wrapped && !arg.type.wrapped) {
            const typeName = DTypes.isPrimitive(param.type) ? param.type.type.replace('Daisy::', '') : StringifyType(param.type);
            throw new DSError(`Argument ${i + 1} of '${context}': parameter expects a shared type ($${typeName}), but '${arg.name}' is not shared`);
        }
    }
}

export function Unwrap(value: DTypes.TypedValue): string {
    return value.type.wrapped ? `${value.name}->get()` : value.name;
}

export namespace Generator {
    export namespace Variables {
        export function create(name: string, value: DTypes.TypedValue, shared: boolean = false): DTypes.TypedValue {
            let type: string;
            let wrappedValue: string;

            if (DTypes.isPrimitive(value.type)) {
                if (shared) {
                    // Use SharedPrimitive types for shared variables
                    const sharedMap: Record<string, string> = {
                        [DTypes.Primitive.Integer]: DTypes.SharedPrimitive.Integer,
                        [DTypes.Primitive.String]: DTypes.SharedPrimitive.String,
                        [DTypes.Primitive.Float]: DTypes.SharedPrimitive.Float,
                    };
                    type = sharedMap[value.type.type] || "auto";
                    // If value is already wrapped, use as-is; otherwise wrap it
                    wrappedValue = value.type.wrapped ? value.name : `Daisy::NewShared(${value.name})`;
                } else {
                    type = DTypes.toCpp(value.type);
                    // If assigning a shared value to a non-shared variable, downcast it
                    wrappedValue = value.type.wrapped ? `${value.name}->get()` : value.name;
                }
            } else {
                type = "auto";
                if (shared) {
                    wrappedValue = value.type.wrapped ? value.name : `Daisy::NewShared(${value.name})`;
                } else {
                    wrappedValue = value.name;
                }
            }

            const code = `${type} ${name} = ${wrappedValue};\n`;
            return TypeString(value.type, code);
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

        export function assignment(target: string, value: DTypes.TypedValue, isShared: boolean): DTypes.TypedValue {
            const rawValue = value.type.wrapped ? `${value.name}->get()` : value.name;
            const code = isShared ? `${target}->set(${rawValue});\n` : `${target} = ${rawValue};\n`;
            return TypeString(value.type, code);
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
        export function binaryOp(left: DTypes.TypedValue, op: string, right: DTypes.TypedValue): DTypes.TypedValue {
            const leftExpr = Unwrap(left);
            const rightExpr = Unwrap(right);
            const code = `${leftExpr} ${op} ${rightExpr}`;
            // Result is a raw computed value, never a shared pointer
            const { wrapped, ...resultType } = left.type as any;
            return TypeString(resultType, code);
        }

        export function methodCall(object: DTypes.TypedValue, method: DTypes.Function, args: DTypes.TypedValue[], methodDef: DTypes.Function): DTypes.TypedValue {
            const argsStr = (RemoveType(args) as string[]).join(", ");
            if (method.isPseudomethod) {
                const code = `${method.cname ?? method.name}(${argsStr})`;
                return TypeString(methodDef.returnType, code);
            }
            else {
                const code = `${object.name}.${method.cname ?? method.name}(${argsStr})`;
                return TypeString(methodDef.returnType, code);
            }
        }

        export function await_(expression: DTypes.TypedValue): DTypes.TypedValue {
            let returnType: DTypes.Type = { kind: "primitive", type: DTypes.Primitive.None };

            if (DTypes.isClass(expression.type) && expression.type.type.methods?.await) {
                returnType = expression.type.type.methods.await.returnType;
            }

            const code = `${expression.name}.await()`;
            return TypeString(returnType, code);
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
            const code = `"${value}"`;
            return TypeString(DTypes.resolve("String"), code);
        }

        export function arrayLiteral(entries: DTypes.TypedValue[]): DTypes.TypedValue {
            const itemType = entries[0].type;
            const code = `Daisy::List<${DTypes.toCpp(itemType)}>({${entries.map(x => RemoveType(x)).join(", ")}})`;
            return TypeString(DTypes.resolveGeneric("List", itemType), code);
        }

        export function arrayIndex(object: DTypes.TypedValue, itemType: DTypes.Type, index: DTypes.TypedValue, setterValue?: DTypes.TypedValue): DTypes.TypedValue {
            if (setterValue) {
                // console.log(object, itemType, index, setterValue);

                if (object.type.wrapped) {
                    const code = `${RemoveType(object)}->setAt(${Unwrap(index)},${RemoveType(setterValue)});`;
                    return TypeString(DTypes.resolve("None"), code);
                }
                else {
                    const code = `${RemoveType(object)}[${Unwrap(index)}] = ${RemoveType(setterValue)};`;
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
                .map(p => `${DTypes.toCppTypedValue(p)} ${p.name}`)
                .join(", ");
            return `DAISY_FUNCTION(${returnType}, ${func.name}, ${params})\n{\n`;
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
            const argsStr = (RemoveType(args) as string[]).join(", ");
            // Handler type already has wrapped: true from its GenericFactory
            const handlerType = DTypes.resolveGeneric("Handler", func.returnType);

            return TypeString(handlerType, `Daisy::Threads::spawn(${func.name} ${argsStr.length == 0 ? "" : ","} ${argsStr})`);
        }

        export function threadCall(func: DTypes.Function, args: DTypes.TypedValue[]): DTypes.TypedValue {
            const argsStr = (RemoveType(args) as string[]).join(", ");
            return TypeString(func.returnType, `Daisy::Threads::call(${func.name}, ${argsStr})`);
        }
    }
}
