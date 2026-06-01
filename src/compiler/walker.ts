import * as ast from "../parser/ast";
import { DTypes } from "./DTypes";
import { Scope } from "./Scope";
import { DSError } from "./DSError";
import { Generator, CheckArgumentTypes, CompareTypes } from "../generator/generator";

const scope: Scope = new Scope();

export let globalCode = '';
export let executableCode = '';

export function TypeString(type: DTypes.Type, str: string, isGlobal = false, wrapped = false): DTypes.TypedValue {
    return { name: str, type, isGlobal, wrapped };
}

export function RemoveType(value: DTypes.TypedValue | DTypes.TypedValue[]): string | string[] {
    if (Array.isArray(value)) {
        return value.map(v => v.name);
    }
    return value.name;
}

export class Walker {
    visit(node: ast.Node | ast.Program): DTypes.TypedValue {
        if (!node) return { name: "", type: { kind: "primitive", type: DTypes.Primitive.None } };

        const nodeType = 'type' in node ? node.type : 'Program';
        switch (nodeType) {
            case 'Program':
                return this.visitProgram(node as ast.Program);
            case 'FunctionDef':
                return this.visitFunctionDef(node as ast.FunctionDef);
            case 'LetStatement':
                return this.visitLetStatement(node as ast.LetStatement);
            case 'ReturnStatement':
                return this.visitReturnStatement(node as ast.ReturnStatement);
            case 'IncludeStatement':
                return this.visitIncludeStatement(node as ast.IncludeStatement);
            case 'CppStatement':
                return this.visitCppStatement(node as ast.CppStatement);
            case 'TypeDef':
                return this.visitTypeDef(node as ast.TypeDef);
            case 'SharedDecl':
                return this.visitSharedDecl(node as ast.SharedDecl);
            case 'WhileStatement':
                return this.visitWhileStatement(node as ast.WhileStatement);
            case 'IfStatement':
                return this.visitIfStatement(node as ast.IfStatement);
            case 'BreakStatement':
                return this.visitBreakStatement(node as ast.BreakStatement);
            case 'ExpressionStatement':
                return this.visitExpressionStatement(node as ast.ExpressionStatement);
            case 'Identifier':
                return this.visitIdentifier(node as ast.Identifier);
            case 'IntegerLiteral':
                return this.visitIntegerLiteral(node as ast.IntegerLiteral);
            case 'StringLiteral':
                return this.visitStringLiteral(node as ast.StringLiteral);
            case 'FloatLiteral':
                return this.visitFloatLiteral(node as ast.FloatLiteral);
            case 'BooleanLiteral':
                return this.visitBooleanLiteral(node as ast.BooleanLiteral);
            case 'MethodCall':
                return this.visitMethodCall(node as ast.MethodCall);
            case 'FunctionCall':
                return this.visitFunctionCall(node as ast.FunctionCall);
            case 'FieldAccess':
                return this.visitFieldAccess(node as ast.FieldAccess);
            case 'CppBlock':
                return this.visitCppBlock(node as ast.CppBlock);
            case 'LambdaExpr':
                return this.visitLambdaExpr(node as ast.LambdaExpr);
            case 'BinaryOp':
                return this.visitBinaryOp(node as ast.BinaryOp);
            case 'SpawnExpr':
                return this.visitSpawnExpr(node as ast.SpawnExpr);
            case 'AwaitExpr':
                return this.visitAwaitExpr(node as ast.AwaitExpr);
            case 'NoneExpr':
                return this.visitNoneExpr(node as ast.NoneExpr);
            case 'AssignmentExpr':
                return this.visitAssignmentExpr(node as ast.AssignmentExpr);
        }
        return { name: "", type: { kind: "primitive", type: DTypes.Primitive.None } };
    }

    visitProgram(node: ast.Program): DTypes.TypedValue {
        globalCode = '';
        executableCode = '';
        for (const stmt of node.statements) {
            const result = this.visit(stmt);
            if (result.isGlobal) {
                globalCode += result.name;
            } else {
                executableCode += result.name;
            }
        }
        return { name: "", type: { kind: "primitive", type: DTypes.Primitive.None } };
    }

    visitFunctionDef(node: ast.FunctionDef): DTypes.TypedValue {
        const params = node.params.map((x): DTypes.TypedValue => {
            if (!x.type) {
                throw new DSError("@todo untyped parameters not supported yet. will become templates");
            }
            const resolvedType = DTypes.resolve(x.type);

            return { name: x.name, type: resolvedType }
        });

        const returnType = DTypes.resolve(node.returnType);

        const funcinfo: DTypes.Function = {
            name: node.name,
            params,
            returnType
        };

        scope.function_mark(node.name, funcinfo, true);

        let code = Generator.Functions.create(funcinfo);
        for (const stmt of node.body) {
            code += this.visit(stmt).name;
        }
        code += Generator.Functions.end();

        scope.exit();

        return TypeString(returnType, code, true);
    }

    visitLetStatement(node: ast.LetStatement): DTypes.TypedValue {
        const value = this.visit(node.value);
        scope.variable_mark({ name: node.name, type: value.type });
        return Generator.Variables.create(node.name, value);
    }

    visitReturnStatement(node: ast.ReturnStatement): DTypes.TypedValue {
        const expr = this.visit(node.expression);
        return Generator.Statements.return_(expr);
    }

    visitIncludeStatement(node: ast.IncludeStatement): DTypes.TypedValue {
        // @todo implement include statement code generation
        return { name: "", type: { kind: "primitive", type: DTypes.Primitive.None } };
    }

    visitCppStatement(node: ast.CppStatement): DTypes.TypedValue {
        // @todo implement cpp statement code generation
        return { name: "", type: { kind: "primitive", type: DTypes.Primitive.None } };
    }

    visitTypeDef(node: ast.TypeDef): DTypes.TypedValue {
        // @todo implement type definition code generation
        return { name: "", type: { kind: "primitive", type: DTypes.Primitive.None } };
    }

    visitSharedDecl(node: ast.SharedDecl): DTypes.TypedValue {
        // @todo implement shared declaration code generation
        return { name: "", type: { kind: "primitive", type: DTypes.Primitive.None } };
    }

    visitWhileStatement(node: ast.WhileStatement): DTypes.TypedValue {
        const condition = this.visit(node.condition);
        let body = "";
        for(const stmt of node.body) {
            body += this.visit(stmt).name;
        }
        return Generator.Statements.while_(condition, body);
    }

    visitIfStatement(node: ast.IfStatement): DTypes.TypedValue {
        const condition = this.visit(node.condition);
        let thenBody = "";
        for(const stmt of node.thenBranch) {
            thenBody += this.visit(stmt).name;
        }

        const elifBranches = node.elifBranches.map(elifBranch => {
            const elifCondition = this.visit(elifBranch.condition);
            let elifBody = "";
            for (const stmt of elifBranch.body) {
                elifBody += this.visit(stmt).name;
            }
            return { condition: elifCondition, body: elifBody };
        });

        let elseBody: string | undefined;
        if (node.elseBranch) {
            elseBody = "";
            for (const stmt of node.elseBranch) {
                elseBody += this.visit(stmt).name;
            }
        }

        return Generator.Statements.if_(condition, thenBody, elifBranches, elseBody);
    }

    visitBreakStatement(node: ast.BreakStatement): DTypes.TypedValue {
        return Generator.Statements.break_();
    }

    visitExpressionStatement(node: ast.ExpressionStatement): DTypes.TypedValue {
        const expr = this.visit(node.expression);
        return Generator.Statements.expressionStatement(expr);
    }

    visitIdentifier(node: ast.Identifier): DTypes.TypedValue {
        const type = scope.variable_find(node.name);
        return { name: node.name, type, wrapped: true };
    }

    visitIntegerLiteral(node: ast.IntegerLiteral): DTypes.TypedValue {
        return Generator.Expressions.integerLiteral(node.value);
    }

    visitStringLiteral(node: ast.StringLiteral): DTypes.TypedValue {
        return Generator.Expressions.stringLiteral(node.value);
    }

    visitFloatLiteral(node: ast.FloatLiteral): DTypes.TypedValue {
        // @todo use Generator.Expressions.floatLiteral when implemented
        return Generator.Expressions.floatLiteral(node.value);
    }

    visitBooleanLiteral(node: ast.BooleanLiteral): DTypes.TypedValue {
        // @todo implement boolean literal code generation and type
        return { name: node.value.toString(), type: { kind: "primitive", type: DTypes.Primitive.None } };
    }

    visitMethodCall(node: ast.MethodCall): DTypes.TypedValue {
        const object = this.visit(node.object);
        const args = node.args.map(arg => this.visit(arg));

        if (!DTypes.isClass(object.type)) {
            throw new DSError(`Cannot call method '${node.method}' on non-class type`);
        }

        const methodDef = object.type.type.methods?.[node.method];
        if (!methodDef) {
            throw new DSError(`Method '${node.method}' not found on class '${object.type.type.name}'`);
        }

        const minParams = methodDef.minParams ?? methodDef.params.length;
        const maxParams = methodDef.params.length;

        if (args.length < minParams || args.length > maxParams) {
            throw new Error(`Method '${node.method}' expects ${minParams === maxParams ? minParams : `${minParams}-${maxParams}`} arguments, got ${args.length}`);
        }

        CheckArgumentTypes(args, methodDef.params, node.method);

        return Generator.Expressions.methodCall(object, node.method, args, methodDef);
    }

    visitFunctionCall(node: ast.FunctionCall): DTypes.TypedValue {
        const func = scope.function_find(node.name);
        const args = node.args.map(arg => this.visit(arg));

        const minParams = func.minParams ?? func.params.length;
        const maxParams = func.params.length;

        if (args.length < minParams || args.length > maxParams) {
            throw new DSError(`Function '${func.name}' expects ${minParams === maxParams ? minParams : `${minParams}-${maxParams}`} arguments, got ${args.length}`);
        }

        CheckArgumentTypes(args, func.params, func.name);

        return Generator.Functions.call(func, args);
    }

    visitFieldAccess(node: ast.FieldAccess): DTypes.TypedValue {
        // @todo implement field access code generation (object.field)
        return this.visit(node.object);
    }

    visitCppBlock(node: ast.CppBlock): DTypes.TypedValue {
        // @todo implement cpp block code generation
        return { name: "", type: { kind: "primitive", type: DTypes.Primitive.None } };
    }

    visitLambdaExpr(node: ast.LambdaExpr): DTypes.TypedValue {
        // @todo implement lambda expression code generation
        return this.visit(node.body);
    }

    visitBinaryOp(node: ast.BinaryOp): DTypes.TypedValue {
        const left = this.visit(node.left);
        const right = this.visit(node.right);
        // console.log(left, right);
        // process.exit();
        return Generator.Expressions.binaryOp(left, node.op, right);
    }

    visitSpawnExpr(node: ast.SpawnExpr): DTypes.TypedValue {
        if (!('name' in node.expression) || node.expression.type !== 'FunctionCall') {
            throw new DSError("Spawn expression must contain a function call");
        }
        const funcCall = node.expression as ast.FunctionCall;
        const func = scope.function_find(funcCall.name);
        const args = funcCall.args.map(arg => this.visit(arg));

        const minParams = func.minParams ?? func.params.length;
        const maxParams = func.params.length;

        if (args.length < minParams || args.length > maxParams) {
            throw new DSError(`Function '${func.name}' expects ${minParams === maxParams ? minParams : `${minParams}-${maxParams}`} arguments, got ${args.length}`);
        }

        CheckArgumentTypes(args, func.params, func.name);

        return Generator.Functions.spawn(func, args);
    }

    visitAwaitExpr(node: ast.AwaitExpr): DTypes.TypedValue {
        const expr = this.visit(node.expression);
        return Generator.Expressions.await_(expr);
    }

    visitNoneExpr(node: ast.NoneExpr): DTypes.TypedValue {
        // @todo implement none expression code generation
        return { name: "", type: { kind: "primitive", type: DTypes.Primitive.None } };
    }

    visitAssignmentExpr(node: ast.AssignmentExpr): DTypes.TypedValue {
        const varType = scope.variable_find(node.target);
        const value = this.visit(node.value);

        if (!CompareTypes(value.type, varType)) {
            throw new DSError(`Cannot assign ${JSON.stringify(value.type)} to variable '${node.target}' of type ${JSON.stringify(varType)}`);
        }

        return Generator.Statements.assignment(node.target, value);
    }
}
