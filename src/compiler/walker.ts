import * as ast from "../parser/ast";
import { DTypes } from "./DTypes";
import { Scope } from "./Scope";
import { DSError, warn } from "./DSError";
import { Generator, CheckArgumentTypes, CompareTypes, Unwrap, StringifyType } from "../generator/generator";

const scope: Scope = new Scope();

export let globalCode = '';
export let executableCode = '';

export function TypeString(type: DTypes.Type, str: string, isGlobal = false): DTypes.TypedValue {
    return { name: str, type, isGlobal };
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
            case 'ConstDecl':
                return this.visitConstDecl(node as ast.ConstDecl);
            case 'AwaitExpr':
                return this.visitAwaitExpr(node as ast.AwaitExpr);
            case 'NotExpr':
                return this.visitNotExpr(node as ast.NotExpr);
            case 'NoneExpr':
                return this.visitNoneExpr(node as ast.NoneExpr);
            case 'AssignmentExpr':
                return this.visitAssignmentExpr(node as ast.AssignmentExpr);
            case 'ListLiteral':
                return this.visitListLiteral(node as ast.ListLiteral);
            case 'IndexAccess':
                return this.visitIndexAccess(node as ast.IndexAccess);
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
            return { name: x.name, type: x.type };
        });

        const returnType = node.returnType;

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
        const literalTypes = new Set(['IntegerLiteral', 'StringLiteral', 'FloatLiteral', 'BooleanLiteral', 'ListLiteral']);
        const isGlobal = !scope.isInFunction() && literalTypes.has(node.value.type);

        if (node.varType) {
            scope.variable_mark({ name: node.name, type: node.varType }, isGlobal);
            if (node.varType.wrapped) {
                const decl = Generator.Variables.create(node.name, value, true);
                return TypeString(node.varType, isGlobal ? `inline ${decl.name}` : decl.name, isGlobal);
            }
        } else {
            scope.variable_mark({ name: node.name, type: value.type }, isGlobal);
        }

        const decl = Generator.Variables.create(node.name, value);
        return TypeString(value.type, isGlobal ? `inline ${decl.name}` : decl.name, isGlobal);
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

    visitConstDecl(node: ast.ConstDecl): DTypes.TypedValue {
        const value = this.visit(node.value);
        const constType: DTypes.Type = { ...value.type, const: true };
        scope.variable_mark({ name: node.name, type: constType }, true);
        const decl = Generator.Variables.create(node.name, value);
        return TypeString(constType, `inline const ${decl.name}`, true);
    }

    visitSharedDecl(node: ast.SharedDecl): DTypes.TypedValue {
        const value = this.visit(node.value);
        const baseType = node.varType ?? value.type;
        const wrappedType: DTypes.Type = { ...baseType, wrapped: true };
        scope.variable_mark({ name: node.name, type: wrappedType }, true);

        // Pass original value (not wrapped) so Variables.create wraps it with NewShared
        const decl = Generator.Variables.create(node.name, value, true);
        return TypeString(wrappedType, `inline ${decl.name}`, true);
    }

    visitWhileStatement(node: ast.WhileStatement): DTypes.TypedValue {
        const condition = this.visit(node.condition);
        let body = "";
        for (const stmt of node.body) {
            body += this.visit(stmt).name;
        }
        return Generator.Statements.while_(condition, body);
    }

    visitIfStatement(node: ast.IfStatement): DTypes.TypedValue {
        const condition = this.visit(node.condition);
        let thenBody = "";
        for (const stmt of node.thenBranch) {
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
        if (scope.isInFunction() && scope.variable_isGlobal(node.name) && !type.wrapped && !type.const) {
            warn(`function accesses unshared global variable '${node.name}', consider using 'shared' for thread safety`);
        }
        return { name: node.name, type };
    }

    visitIntegerLiteral(node: ast.IntegerLiteral): DTypes.TypedValue {
        return Generator.Expressions.integerLiteral(node.value);
    }

    visitStringLiteral(node: ast.StringLiteral): DTypes.TypedValue {
        return Generator.Expressions.stringLiteral(node.value);
    }

    visitFloatLiteral(node: ast.FloatLiteral): DTypes.TypedValue {
        return Generator.Expressions.floatLiteral(node.value);
    }

    visitBooleanLiteral(node: ast.BooleanLiteral): DTypes.TypedValue {
        return { name: node.value.toString(), type: { kind: "primitive", type: DTypes.Primitive.Bool } };
    }

    visitMethodCall(node: ast.MethodCall): DTypes.TypedValue {
        const object = this.visit(node.object);

        // Validate lambda param type against list item type before visiting the body
        if ((node.method === 'map' || node.method === 'filter') && DTypes.isList(object.type)) {
            const itemType = object.type.type.itemType;
            const lambdaNode = node.args[0];
            if (lambdaNode?.type === 'LambdaExpr') {
                const firstParam = (lambdaNode as ast.LambdaExpr).params[0];
                if (firstParam?.type && !CompareTypes(firstParam.type, itemType)) {
                    throw new DSError(`'${node.method}' callback parameter must be '${StringifyType(itemType)}' (the list's item type), but got '${StringifyType(firstParam.type)}'`);
                }
            }
        }

        const args = node.args.map(arg => this.visit(arg));

        if (!DTypes.isClass(object.type)) {
            if (DTypes.isPrimitive(object.type) || DTypes.isList(object.type)) {
                const pm = DTypes.getPseudomethods(object.type);
                if (!pm || !pm[node.method]) {
                    throw new DSError(`Pseudomethod "${node.method}" does not exist on type "${StringifyType(object.type)}"`);
                }
                let methodDef = { ...pm[node.method] };
                if (node.typeArg && (node.method === 'map' || node.method === 'filter' || node.method === 'reduce')) { // @todo clean up!
                    methodDef.returnType = DTypes.resolveGeneric('List', node.typeArg);
                    if (node.args[0]?.type === 'LambdaExpr') {
                        const lambdaType = args[0].type;
                        const bodyReturnType = lambdaType.kind === 'function' ? lambdaType.type.returnType : lambdaType;
                        if (!CompareTypes(bodyReturnType, node.typeArg)) {
                            throw new DSError(`'${node.method}<${StringifyType(node.typeArg)}>' expects callback to return '${StringifyType(node.typeArg)}', but it returns '${StringifyType(bodyReturnType)}'`);
                        }
                    }
                }
                const minParams = methodDef.minParams ?? methodDef.params.length;
                const maxParams = methodDef.params.length;
                args.unshift(object);
                if (args.length < minParams || args.length > maxParams) {
                    throw new Error(`Pseudo '${node.method}' expects ${minParams === maxParams ? minParams : `${minParams}-${maxParams}`} arguments, got ${args.length}`);
                }
                CheckArgumentTypes(args, methodDef.params, node.method);
                return Generator.Expressions.methodCall(object, methodDef, args, methodDef);
            }
            throw new DSError(`Cannot call method "${node.method}" on non-class type "${StringifyType(object.type)}"`);
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

        return Generator.Expressions.methodCall(object, methodDef, args, methodDef);
    }

    visitFunctionCall(node: ast.FunctionCall): DTypes.TypedValue {
        const func = scope.function_find(node.name);
        const args = node.args.map(arg => this.visit(arg));

        const minParams = func.minParams ?? func.params.length;
        const maxParams = func.params.length;

        if (args.length < minParams || (!func.variadic && args.length > maxParams)) {
            throw new DSError(`Function '${func.name}' expects ${minParams === maxParams ? minParams : `${minParams}-${maxParams}`} arguments, got ${args.length}`);
        }

        CheckArgumentTypes(args, func.params, func.name, func.variadic);

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
        scope.enter();
        for (const p of node.params) {
            scope.variable_mark({ name: p.name, type: p.type ?? { kind: 'any' } });
        }
        const body = this.visit(node.body);
        scope.exit();
        if (node.returnType && !CompareTypes(body.type, node.returnType)) {
            throw new DSError(`Lambda body returns '${StringifyType(body.type)}' but declared return type is '${StringifyType(node.returnType)}'`);
        }
        return Generator.Expressions.lambda(node.params, body);
    }

    visitBinaryOp(node: ast.BinaryOp): DTypes.TypedValue {
        const left = this.visit(node.left);
        const right = this.visit(node.right);
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

    visitNotExpr(node: ast.NotExpr): DTypes.TypedValue {
        const expr = this.visit(node.expression);
        return { name: `!${expr.name}`, type: DTypes.resolve('Bool') };
    }

    visitNoneExpr(node: ast.NoneExpr): DTypes.TypedValue {
        // @todo implement none expression code generation
        return { name: "", type: { kind: "primitive", type: DTypes.Primitive.None } };
    }

    visitIndexAccess(node: ast.IndexAccess, setterValue?: DTypes.TypedValue): DTypes.TypedValue {
        const object = this.visit(node.object);
        const index = this.visit(node.index);

        // console.log(object, "AAAAOIAKAO", index)

        if (!DTypes.isList(object.type)) {
            throw new DSError(`"${object}" is of type "${object.type}", and is not a list`);
        }

        if (!DTypes.isInteger(index.type)) {
            throw new DSError(`"${index} is of type "${index.type}", is not an Integer, and cannot be used to index`);
        }

        const itemType = object.type.type.itemType;

        if (setterValue && !CompareTypes(setterValue.type, itemType)) {
            throw new DSError(`Array expects type "${itemType}" but setting with type "${setterValue.type}"`);
        }

        return Generator.Expressions.arrayIndex(object, itemType, index, setterValue);

        // process.exit()
    }

    visitListLiteral(node: ast.ListLiteral): DTypes.TypedValue {
        const entries = node.elements.map(arg => this.visit(arg));

        const referenceType = entries[0].type;

        const foundDifferent = entries.findIndex(x => x.type != referenceType);
        if (foundDifferent != -1) {
            throw new DSError(`Entry number [${foundDifferent}] is of type "${StringifyType(entries[foundDifferent].type)}" but expected a "${StringifyType(referenceType)}"`);
        }

        return Generator.Expressions.arrayLiteral(entries);
    }

    visitAssignmentExpr(node: ast.AssignmentExpr): DTypes.TypedValue {
        const value = this.visit(node.value);

        let targetName: string;
        let varType: DTypes.Type;
        let isShared: boolean;

        if (node.target.type === 'IndexAccess') {
            const target = this.visitIndexAccess(node.target, value);

            // targetName = target.name;
            // varType = target.type;
            // isShared = false;

            // console.log("Ooo", target);
            // process.exit();
            return target
        }
        else {
            targetName = node.target.name;
            varType = scope.variable_find(targetName);
            isShared = varType.wrapped === true;
        }

        if (!CompareTypes(value.type, varType)) {
            throw new DSError(`Cannot assign ${StringifyType(value.type)} to variable '${node.target.name}' of type ${StringifyType(varType)}`);
        }

        return Generator.Statements.assignment(node.target.name, value, isShared);
    }
}
