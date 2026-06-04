import * as ast from "../parser/ast";
import { DTypes } from "./DTypes";
import { Scope, ScopeType } from "./Scope";
import { DSError, warn } from "./DSError";
import { Generator, CheckArgumentTypes, CompareTypes, Unwrap, StringifyType } from "../generator/generator";

const scope: Scope = new Scope();
export let activeLineNumber = 0;

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
        if("line" in node && node.line)
        {
            activeLineNumber = node.line;
        }

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

    visitReturnStatement(node: ast.ReturnStatement): DTypes.TypedValue {
        const expr = this.visit(node.expression);
        const fn = scope.findParentScope(ScopeType.Function)?.info;
        if (fn && !CompareTypes(expr.type, fn.returnType)) {
            throw new DSError(`Function '${fn.name}' declares return type '${StringifyType(fn.returnType)}' but returns '${StringifyType(expr.type)}'`, node.line);
        }
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


    visitLetStatement(node: ast.LetStatement): DTypes.TypedValue {
        const value = this.visit(node.value);
        // const atTopLevel = !scope.findParentScope(ScopeType.Function);
        const atTopLevel = scope.inGlobalScope();
        const isWrapped = node.varType?.wrapped ?? false;
        const finalType = node.varType ?? value.type;
        scope.variable_mark({ name: node.name, type: finalType }, atTopLevel);

        if (atTopLevel) {
            const result = Generator.Variables.declareGlobal(node.name, value, isWrapped);
            if (result) {
                globalCode += result.forward;
                return TypeString(finalType, result.assign, false);
            }
        }

        const decl = Generator.Variables.create(node.name, value, isWrapped);
        return TypeString(finalType, decl.name, false);
    }


    visitConstDecl(node: ast.ConstDecl): DTypes.TypedValue { // @todo repeated code as let. refactor
        const value = this.visit(node.value);
        const atTopLevel = scope.inGlobalScope();
        const constType: DTypes.Type = { ...value.type, const: true };
        if(constType.wrapped)
        {
            throw new DSError(`Constant declarations do not need to be shared, as they cannot be modified`);
        }
        scope.variable_mark({ name: node.name, type: constType }, atTopLevel);

        if (atTopLevel) {
            const result = Generator.Variables.declareGlobal(node.name, value);
            if (result) {
                globalCode += result.forward;
                return TypeString(constType, result.assign, false);
            }
        }

        const decl = Generator.Variables.create(node.name, value);
        return TypeString(constType, decl.name, false);
    }

    visitSharedDecl(node: ast.SharedDecl): DTypes.TypedValue {
        const atTopLevel = scope.inGlobalScope();
        const value = this.visit(node.value);
        const baseType = node.varType ?? value.type;
        const wrappedType: DTypes.Type = { ...baseType, wrapped: true };
        scope.variable_mark({ name: node.name, type: wrappedType }, atTopLevel);

        if (atTopLevel) {
            const result = Generator.Variables.declareGlobal(node.name, value, true);
            if (result) {
                globalCode += result.forward;
                return TypeString(wrappedType, result.assign, false);
            }
        }

        const decl = Generator.Variables.create(node.name, value, true);
        return TypeString(wrappedType, decl.name, false);
    }

    visitWhileStatement(node: ast.WhileStatement): DTypes.TypedValue {
        const condition = this.visit(node.condition);
        scope.enter(ScopeType.While);
        let body = "";
        for (const stmt of node.body) {
            body += this.visit(stmt).name;
        }
        scope.exit();
        return Generator.Statements.while_(condition, body);
    }

    visitIfStatement(node: ast.IfStatement): DTypes.TypedValue {
        const condition = this.visit(node.condition);
        scope.enter(ScopeType.If);
        let thenBody = "";
        for (const stmt of node.thenBranch) {
            thenBody += this.visit(stmt).name;
        }
        scope.exit();

        const elifBranches = node.elifBranches.map(elifBranch => {
            const elifCondition = this.visit(elifBranch.condition);
            scope.enter(ScopeType.If);
            let elifBody = "";
            for (const stmt of elifBranch.body) {
                elifBody += this.visit(stmt).name;
            }
            scope.exit();
            return { condition: elifCondition, body: elifBody };
        });

        let elseBody: string | undefined;
        if (node.elseBranch) {
            scope.enter(ScopeType.If);
            elseBody = "";
            for (const stmt of node.elseBranch) {
                elseBody += this.visit(stmt).name;
            }
            scope.exit();
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
        const fnType = scope.function_findType(node.name);
        if (fnType && DTypes.isFunction(fnType)) {
            if (fnType.type.cname) {
                return { name: fnType.type.cname, type: fnType };
            }
            // User-defined functions take SlaveChannel as their first arg (DAISY_FUNCTION).
            // Daisy::Threads::call() handles that internally, so wrap here to hide it.
            const wrapper = `[&](auto&&... __a){ return Daisy::Threads::call(${node.name}, std::forward<decltype(__a)>(__a)...); }`;
            return { name: wrapper, type: fnType };
        }
        const type = scope.variable_find(node.name);
        if (scope.findParentScope(ScopeType.Function) && scope.variable_resolvesFromGlobal(node.name) && !type.wrapped && !type.const) {
            // console.log(scope.findParentScope(ScopeType.Function))
            warn(`function accesses unshared global variable '${node.name}', consider using 'shared' or 'const' for thread safety`);
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

        const args = node.args.map(arg => this.visit(arg));

        // Validate lambda param type against list item type
        if (DTypes.isList(object.type)) {
            const itemType = object.type.type.itemType;
            const callbackType = args[0]?.type;
            if (callbackType && DTypes.isFunction(callbackType)) {
                const firstParamType = callbackType.type.params[0]?.type;
                if (firstParamType && !DTypes.isAny(firstParamType) && !CompareTypes(firstParamType, itemType)) {
                    throw new DSError(`'${node.method}' callback parameter must be '${StringifyType(itemType)}' (the list's item type), but got '${StringifyType(firstParamType)}'`, node.line);
                }
            }
        }

        if (!DTypes.isClass(object.type)) { // @todo clean this mess up
            if (DTypes.isPrimitive(object.type) || DTypes.isList(object.type)) {
                const pm = DTypes.getPseudomethods(object.type);
                if (!pm || !pm[node.method]) {
                    throw new DSError(`Pseudomethod "${node.method}" does not exist on type "${StringifyType(object.type)}"`, node.line);
                }
                let methodDef = { ...pm[node.method] };
                if (methodDef.inferReturnTypeFromSelf) {
                    methodDef = { ...methodDef, returnType: methodDef.inferReturnTypeFromSelf(object.type) };
                } else if (methodDef.inferReturnType) {
                    const callbackType = args[0]?.type;
                    const fnReturnType = callbackType && DTypes.isFunction(callbackType)
                        ? callbackType.type.returnType
                        : undefined;
                    if (!fnReturnType || DTypes.isAny(fnReturnType)) {
                        throw new DSError(`'${node.method}' requires a typed callback — the return type must be known (add '-> Type' on the lambda)`, node.line);
                    }
                    methodDef = { ...methodDef, returnType: methodDef.inferReturnType(object.type, fnReturnType) };
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
            throw new DSError(`Cannot call method "${node.method}" on non-class type "${StringifyType(object.type)}"`, node.line);
        }

        const methodDef = object.type.type.methods?.[node.method];
        if (!methodDef) {
            throw new DSError(`Method '${node.method}' not found on class '${object.type.type.name}'`, node.line);
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
            throw new DSError(`Function '${func.name}' expects ${minParams === maxParams ? minParams : `${minParams}-${maxParams}`} arguments, got ${args.length}`, node.line);
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
        scope.enter(ScopeType.If);
        for (const p of node.params) {
            scope.variable_mark({ name: p.name, type: p.type ?? { kind: 'any' } });
        }
        const body = this.visit(node.body);
        scope.exit();
        if (node.returnType && !CompareTypes(body.type, node.returnType)) {
            throw new DSError(`Lambda body returns '${StringifyType(body.type)}' but declared return type is '${StringifyType(node.returnType)}'`, node.line);
        }
        return Generator.Expressions.lambda(node.params, body);
    }

    visitBinaryOp(node: ast.BinaryOp): DTypes.TypedValue {
        const left = this.visit(node.left);
        const right = this.visit(node.right);
        return Generator.Expressions.binaryOp(left, node.op, right);
    }

    // Resolves any call-expression node to its function definition + evaluated args.
    // Handles FunctionCall, MethodCall (class methods and pseudomethods), and any
    // future call-shaped nodes — so callers like visitSpawnExpr stay generic.
    private resolveCallTarget(node: ast.Expression, line?: number): { func: DTypes.Function; args: DTypes.TypedValue[] } {
        if (node.type === 'FunctionCall') {
            const n = node as ast.FunctionCall;
            const func = scope.function_find(n.name);
            const args = n.args.map(arg => this.visit(arg));
            return { func, args };
        }

        if (node.type === 'MethodCall') {
            const n = node as ast.MethodCall;
            const object = this.visit(n.object);
            const args = n.args.map(arg => this.visit(arg));

            if (DTypes.isClass(object.type)) {
                const methodDef = object.type.type.methods?.[n.method];
                if (!methodDef) throw new DSError(`Method '${n.method}' not found on '${object.type.type.name}'`, line);
                return { func: methodDef, args };
            }

            const pm = DTypes.getPseudomethods(object.type);
            const methodDef = pm?.[n.method];
            if (!methodDef) throw new DSError(`Pseudomethod '${n.method}' not found on '${StringifyType(object.type)}'`, line);
            return { func: methodDef, args: [object, ...args] };
        }

        throw new DSError("Spawn requires a call expression", line);
    }

    visitSpawnExpr(node: ast.SpawnExpr): DTypes.TypedValue {
        const { func, args } = this.resolveCallTarget(node.expression, node.line);

        const minParams = func.minParams ?? func.params.length;
        const maxParams = func.params.length;
        if (args.length < minParams || args.length > maxParams) {
            throw new DSError(`'${func.name}' expects ${minParams === maxParams ? minParams : `${minParams}-${maxParams}`} arguments, got ${args.length}`, node.line);
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
            throw new DSError(`"${object}" is of type "${object.type}", and is not a list`, node.line);
        }

        if (!DTypes.isInteger(index.type)) {
            throw new DSError(`"${index} is of type "${index.type}", is not an Integer, and cannot be used to index`, node.line);
        }

        const itemType = object.type.type.itemType;

        if (setterValue && !CompareTypes(setterValue.type, itemType)) {
            throw new DSError(`Array expects type "${itemType}" but setting with type "${setterValue.type}"`, node.line);
        }

        return Generator.Expressions.arrayIndex(object, itemType, index, setterValue);

        // process.exit()
    }

    visitListLiteral(node: ast.ListLiteral): DTypes.TypedValue {
        const entries = node.elements.map(arg => this.visit(arg));

        const referenceType = entries[0].type;

        const foundDifferent = entries.findIndex(x => {
            return !CompareTypes(x.type, referenceType)
    });
        if (foundDifferent != -1) {
            throw new DSError(`Entry number [${foundDifferent}] is of type "${StringifyType(entries[foundDifferent].type)}" but expected a "${StringifyType(referenceType)}"`, node.line);
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
            if (varType.const) {
                throw new DSError(`Cannot assign to '${targetName}' — it is declared const`, node.line);
            }
            isShared = varType.wrapped === true;
        }

        if (!CompareTypes(value.type, varType)) {
            throw new DSError(`Cannot assign ${StringifyType(value.type)} to variable '${node.target.name}' of type ${StringifyType(varType)}`, node.line);
        }

        return Generator.Statements.assignment(node.target.name, value, isShared);
    }
}
