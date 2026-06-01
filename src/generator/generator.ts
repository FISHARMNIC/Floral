import { DTypes } from "../compiler/DTypes";
import { Scope } from "../compiler/Scope";
import { RemoveType, TypeString } from "../compiler/walker";

export function CompareTypes(actual: DTypes.Type, expected: DTypes.Type): boolean {
    if ((expected as any).kind === "any" || (actual as any).kind === "any") {
        return true;
    }
    return JSON.stringify(actual) === JSON.stringify(expected);
}

export function CheckArgumentTypes(args: DTypes.TypedValue[], params: DTypes.TypedValue[], context: string): void {
    for (let i = 0; i < args.length; i++) {
        const argType = args[i].type;
        const paramType = params[i].type;

        if (!CompareTypes(argType, paramType)) {
            throw new Error(`Argument ${i + 1} of '${context}': expected ${JSON.stringify(paramType)}, got ${JSON.stringify(argType)}`);
        }
    }
}

export namespace Generator
{
    export namespace Variables
    {
        export function create(name: string, value: DTypes.TypedValue): DTypes.TypedValue
        {
            const type = (value.type as any).kind === "primitive" ? DTypes.toCpp(value.type) : "auto";
            const code = `${type} ${name} = ${value.name};\n`;
            return TypeString(value.type, code);
        }

        export function read(name: string, type: DTypes.Type): DTypes.TypedValue
        {
            return TypeString(type, name);
        }
    }

    export namespace Statements
    {
        export function return_(expr: DTypes.TypedValue): DTypes.TypedValue
        {
            const code = `return ${expr.name};\n`;
            return TypeString(expr.type, code);
        }

        export function expressionStatement(expr: DTypes.TypedValue): DTypes.TypedValue
        {
            const endsWithSemicolon = expr.name.endsWith(';\n') || expr.name.endsWith(';');
            const code = endsWithSemicolon ? `${expr.name}${expr.name.endsWith('\n') ? '' : '\n'}` : `${expr.name};\n`;
            return TypeString(expr.type, code);
        }

        export function assignment(target: string, value: DTypes.TypedValue): DTypes.TypedValue
        {
            const code = `${target} = ${value.name};\n`;
            return TypeString(value.type, code);
        }

        export function while_(condition: DTypes.TypedValue, body: string): DTypes.TypedValue
        {
            const code = `while (${condition.name}) {\n${body}}\n`;
            return TypeString({ kind: "primitive", type: DTypes.Primitive.None }, code);
        }

        export function if_(condition: DTypes.TypedValue, thenBody: string, elifBranches: Array<{condition: DTypes.TypedValue, body: string}>, elseBody?: string): DTypes.TypedValue
        {
            let code = `if (${condition.name}) {\n${thenBody}}\n`;

            for (const elifBranch of elifBranches) {
                code += `else if (${elifBranch.condition.name}) {\n${elifBranch.body}}\n`;
            }

            if (elseBody) {
                code += `else {\n${elseBody}}\n`;
            }

            return TypeString({ kind: "primitive", type: DTypes.Primitive.None }, code);
        }

        export function break_(): DTypes.TypedValue
        {
            return TypeString({ kind: "primitive", type: DTypes.Primitive.None }, "break;\n");
        }
    }

    export namespace Expressions
    {
        export function binaryOp(left: DTypes.TypedValue, op: string, right: DTypes.TypedValue): DTypes.TypedValue
        {
            const code = `${left.name} ${op} ${right.name}`;
            return TypeString(left.type, code);
        }

        export function methodCall(object: DTypes.TypedValue, method: string, args: DTypes.TypedValue[], methodDef: DTypes.Function): DTypes.TypedValue
        {
            const argsStr = (RemoveType(args) as string[]).join(", ");
            const code = `${object.name}.${method}(${argsStr})`;
            return TypeString(methodDef.returnType, code);
        }

        export function await_(expression: DTypes.TypedValue): DTypes.TypedValue
        {
            const exprType = expression.type as any;
            let returnType: DTypes.Type = { kind: "primitive", type: DTypes.Primitive.None };

            if (exprType.kind === "class" && exprType.type.methods?.await) {
                returnType = exprType.type.methods.await.returnType;
            }

            const code = `${expression.name}.await()`;
            return TypeString(returnType, code);
        }

        export function floatLiteral(value: number): DTypes.TypedValue
        {
            const code = `Daisy::NewShared(static_cast<double>(${value}))`;
            return TypeString({ kind: "primitive", type: DTypes.Primitive.Float }, code);
        }

        export function integerLiteral(value: number): DTypes.TypedValue
        {
            const code = `Daisy::NewShared(static_cast<uint64_t>(${value}))`;
            return TypeString({ kind: "primitive", type: DTypes.Primitive.Integer }, code);
        }

        export function stringLiteral(value: string): DTypes.TypedValue
        {
            const code = `Daisy::NewShared("${value}")`;
            return TypeString({ kind: "primitive", type: DTypes.Primitive.String }, code);
        }
    }

    export namespace Functions
    {
        export function create(func: DTypes.Function): string
        {
            const returnType = DTypes.toCpp(func.returnType);
            const params = func.params
                .map(p => `${DTypes.toCpp(p.type)} ${p.name}`)
                .join(", ");

            return `DAISY_FUNCTION(${returnType}, ${func.name}, ${params})\n{\n`;
        }

        export function end(): string
        {
            return "\n}\n";
        }

        export function call(scope: Scope, func: DTypes.Function, args: DTypes.TypedValue[]): DTypes.TypedValue
        {
            const argsStr = (RemoveType(args) as string[]).join(", ");
            return TypeString(func.returnType, `${scope.function_getName(func)}(${argsStr})`);
        }

        export function spawn(func: DTypes.Function, args: DTypes.TypedValue[]): DTypes.TypedValue
        {
            const argsStr = (RemoveType(args) as string[]).join(", ");
            const handlerType = DTypes.resolveGeneric("Handler", func.returnType);

            return TypeString(handlerType, `Daisy::Threads::spawn(${func.name}, ${argsStr})`);
        }

        export function threadCall(func: DTypes.Function, args: DTypes.TypedValue[]): DTypes.TypedValue
        {
            const argsStr = (RemoveType(args) as string[]).join(", ");
            return TypeString(func.returnType, `Daisy::Threads::call(${func.name}, ${argsStr})`);
        }
    }
}