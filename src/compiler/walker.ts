import * as ast from "../parser/ast";
import * as path from "path";
import { DTypes } from "./DTypes";
import { Scope, ScopeType } from "./Scope";
import { DSError, DSWarn } from "./DSError";
import { Generator, CheckArgumentTypes, CompareTypes, StringifyType, Unwrap } from "../generator/generator";
import { session } from "./context";

export function TypeString(type: DTypes.Type, str: string, isGlobal = false): DTypes.TypedValue {
    return { name: str, type, isGlobal };
}

export function RemoveType(value: DTypes.TypedValue | DTypes.TypedValue[]): string | string[] {
    if (Array.isArray(value)) {
        return value.map(v => v.name);
    }
    return value.name;
}

function unescapeString(s: string) {
    return s
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\r/g, '\r')
        .replace(/\\\\/g, '\\')
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'");
}

export type ExportedItem =
    | { kind: 'function'; name: string; func: DTypes.Function }
    | { kind: 'variable'; name: string; varType: DTypes.Type }
    | { kind: 'type'; name: string; typeVal: DTypes.Type };

export class Walker {
    private scope: Scope = new Scope();
    globalCode = '';
    executableCode = '';
    includeCode = '';
    localIncludes: { src: string; basename: string }[] = [];
    exports: ExportedItem[] = [];
    sourceFile?: string;


    visit(node: ast.Node | ast.Program): DTypes.TypedValue {
        if (!node) return { name: "", type: { kind: "primitive", type: DTypes.Primitive.None } };

        const nodeType = 'type' in node ? node.type : 'Program';
        if ("line" in node && node.line) {
            session.lineNumberStack.setActive(node.line);
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
            case 'IncludeStatement': // @todo remove
                return this.visitIncludeStatement(node as ast.IncludeStatement);
            case 'TypeDef':
                return this.visitTypeDef(node as ast.TypeDef);
            case 'SharedDecl':
                return this.visitSharedDecl(node as ast.SharedDecl);
            case 'RestrictedDecl':
                return this.visitRestrictedDecl(node as ast.RestrictedDecl);
            case 'WhileStatement':
                return this.visitWhileStatement(node as ast.WhileStatement);
            case 'RepeatStatement':
                return this.visitRepeatStatement(node as ast.RepeatStatement);
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
            case 'ExprCall':
                return this.visitExprCall(node as ast.ExprCall);
            case 'FieldAccess':
                return this.visitFieldAccess(node as ast.FieldAccess);
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
            case 'NegExpr':
                return this.visitNegExpr(node as ast.NegExpr);
            case 'NoneExpr':
                return this.visitNoneExpr(node as ast.NoneExpr);
            case 'AssignmentExpr':
                return this.visitAssignmentExpr(node as ast.AssignmentExpr);
            case 'ListLiteral':
                return this.visitListLiteral(node as ast.ListLiteral);
            case 'IndexAccess':
                return this.visitIndexAccess(node as ast.IndexAccess);
            case 'StructLiteral':
                return this.visitStructLiteral(node as ast.StructLiteral);
            case 'InterpolatedString':
                return this.visitInterpolatedString(node as ast.InterpolatedString);
            case 'GroupExpr':
                return this.visitGroupExpr(node as ast.GroupExpr);
            case 'TypeRef':
                return this.visitTypeRef(node as ast.TypeRef);
            case 'ImportStatement':
                return this.visitImportStatement(node as ast.ImportStatement);
            case 'ExportDeclaration':
                return this.visitExportDeclaration(node as ast.ExportDeclaration);
        }
        return { name: "", type: { kind: "primitive", type: DTypes.Primitive.None } };
    }

    visitProgram(node: ast.Program): DTypes.TypedValue {
        this.globalCode = '';
        this.executableCode = '';
        this.includeCode = '';
        this.scope = new Scope();
        DTypes.reset();
        for (const stmt of node.statements) {
            const result = this.visit(stmt);
            if (result.isGlobal) {
                this.globalCode += result.name;
            } else {
                this.executableCode += result.name;
            }
        }
        return { name: "", type: { kind: "primitive", type: DTypes.Primitive.None } };
    }

    visitFunctionDef(node: ast.FunctionDef): DTypes.TypedValue {
        const params = node.params.map((x): DTypes.TypedValue => {
            if (!x.type) {
                throw new DSError("@todo untyped parameters not supported yet. will become templates");
            }
            const t = x.type;
            if ((DTypes.isStruct(t) || DTypes.isList(t)) && t.wrapType !== "shared" && !t.const) {
                DSWarn(`parameter '${x.name}' is local, and mutations won't be visible across spawn/call boundaries. Consider 'shared' or 'const ${DTypes.isStruct(t) ? t.type.name : `List<...>`}'`);
            }
            return { name: x.name, type: x.type };
        });

        const returnType = node.returnType;

        const funcinfo: DTypes.Function = {
            name: node.name,
            params,
            returnType
        };

        this.scope.function_mark(node.name, funcinfo, true);

        let code = Generator.Functions.create(funcinfo);
        for (const stmt of node.body) {
            code += this.visit(stmt).name;
        }
        code += Generator.Functions.end();

        this.scope.exit();

        return TypeString(returnType, code, true);
    }

    visitReturnStatement(node: ast.ReturnStatement): DTypes.TypedValue {
        const expr = this.visit(node.expression);
        const fn = this.scope.findParentScope(ScopeType.Function)?.info;
        if (fn && !CompareTypes(expr.type, fn.returnType)) {
            throw new DSError(`Function '${fn.name}' declares return type '${StringifyType(fn.returnType)}' but returns '${StringifyType(expr.type)}'`);
        }
        return Generator.Statements.return_(expr);
    }

    visitIncludeStatement(node: ast.IncludeStatement): DTypes.TypedValue {
        // @todo implement include statement code generation
        return { name: "", type: { kind: "primitive", type: DTypes.Primitive.None } };
    }

    visitTypeDef(node: ast.TypeDef): DTypes.TypedValue {

        const props: DTypes.MarkedTypes = {};
        node.fields.forEach(x => { // @todo cleanup TypeField vs TypedValue and refactor this function
            // console.log("")
            
            // @todo FIXXXXXXXXXXX the messy handler exclusion
            if (x.fieldType.wrapType == 'shared' && !((x.fieldType as any)?.type?.name.includes("Daisy::Threads::Handler"))) {
                // console.log(x.fieldType)
                // shouldnt get here but in case end up moving checking out of cst printer
                throw new DSError(`Sub-types cannot be shared, instead share the wrapper type`);
            }
            props[x.name] = x.fieldType
        });

        const newType: DTypes.Type = {
            kind: "struct", type: {
                name: node.name,
                properties: props
            }
        }

        DTypes.declare(node.name, newType);
        this.globalCode += Generator.Types.createStruct(newType.type);

        return { name: "", type: { kind: "primitive", type: DTypes.Primitive.None } };
    }

    visitStructLiteral(node: ast.StructLiteral): DTypes.TypedValue {

        // console.log("finding", node.structName)
        const structType = DTypes.resolve(node.structName);
        // console.log("found", structType);
        if (structType.kind != 'struct') {
            throw new DSError(`Type "${structType}" is not a struct`);
        }

        const properties = structType.type.properties;

        const mapped = node.fields.map(x => {
            const name = x.name;
            const value = this.visit(x.value);

            const expected = properties[name];
            if(!expected)
            {
                throw new DSError(`Struct "${node.structName}" doesn't have a member called "${name}", or the struct doesnt exist (@todo sorry, this will be fixed)`);
            }
            // console.log("MAPPING", structType, name, value);

            if (!CompareTypes(expected, value.type)) {
                throw new DSError(`Property "${name}" of struct "${node.structName}" expects an "${StringifyType(expected)}" but was given a "${StringifyType(value.type)}"`)
            }

            return { name, value }
        });

        const instanced = Generator.Types.instanceStruct(structType, mapped);
        return instanced;

        // return { name: "", type: { kind: "primitive", type: DTypes.Primitive.None } };
    }

    visitGroupExpr(node: ast.GroupExpr): DTypes.TypedValue {
        const inner = this.visit(node.expression);
        return { ...inner, name: `(${inner.name})` };
    }

    visitTypeRef(node: ast.TypeRef): DTypes.TypedValue {
        return { name: '', type: DTypes.resolve(node.name) };
    }

    visitInterpolatedString(node: ast.InterpolatedString): DTypes.TypedValue {
        const builder = node.parts.map(x => typeof (x) == 'string' ? x : this.visit(x))

        const res = Generator.Expressions.interpolateString(builder);

        return res;

        // console.log(res)
        // process.exit()
    }

    visitLetStatement(node: ast.LetStatement): DTypes.TypedValue {
        const atTopLevel = this.scope.inGlobalScope();
        // const isWrapped = node.varType?.wrapped ?? false;

        if (!node.value) {
            if (!node.varType) throw new DSError(`'${node.name}' requires a type annotation when declared without a value`);
            const finalType = node.varType;
            const cppType = DTypes.toCpp(finalType);
            this.scope.variable_mark({ name: node.name, type: finalType }, atTopLevel);
            const code = `${cppType} ${node.name} = {};\n`;
            if (atTopLevel) this.globalCode += `export ${cppType} ${node.name} = {};\n`;
            return TypeString(finalType, atTopLevel ? "" : code, false);
        }

        const value = this.visit(node.value);
        const inferredType = node.varType ?? { ...value.type, const: false, restricted: false };
        const rawType = !node.varType && inferredType.wrapType === "shared"
            ? { ...inferredType, wrapType: undefined }
            : inferredType;
        const finalType: DTypes.Type = (DTypes.isStruct(rawType) || DTypes.isList(rawType)) && !rawType.wrapType && !rawType.pureCppClass
            ? { ...rawType, wrapType: "local" }
            : rawType;

        if (!atTopLevel && this.scope.variable_exists_local(node.name)) {
            throw new DSError(`Variable '${node.name}' is already declared in this scope`);
        }

        this.scope.variable_mark({ name: node.name, type: finalType }, atTopLevel);

        if (atTopLevel) {
            const result = Generator.Variables.declareGlobal(node.name, value, finalType);
            if (result) {
                this.globalCode += result.forward;
                return TypeString(finalType, result.assign, false);
            }
        }

        const decl = Generator.Variables.create(node.name, value, finalType);
        return TypeString(finalType, decl.name, false);
    }


    visitConstDecl(node: ast.ConstDecl): DTypes.TypedValue { // @todo repeated code as let. refactor
        const atTopLevel = this.scope.inGlobalScope();

        if (!node.value) {
            if (!node.varType) throw new DSError(`'${node.name}' requires a type annotation when declared without a value`);
            const constType: DTypes.Type = { ...node.varType, const: true };
            const cppType = DTypes.toCpp(constType);
            this.scope.variable_mark({ name: node.name, type: constType }, atTopLevel);
            const code = `${cppType} ${node.name} = {};\n`;
            if (atTopLevel) this.globalCode += `export ${cppType} ${node.name} = {};\n`;
            return TypeString(constType, atTopLevel ? "" : code, false);
        }

        const value = this.visit(node.value);
        const constType: DTypes.Type = { ...(node.varType ?? value.type), const: true };
        if (constType.wrapType === "shared") {
            throw new DSError(`Constant declarations do not need to be shared, as they cannot be modified`);
        }
        this.scope.variable_mark({ name: node.name, type: constType }, atTopLevel);

        if (atTopLevel) {
            const result = Generator.Variables.declareGlobal(node.name, value, constType);
            if (result) {
                this.globalCode += result.forward;
                return TypeString(constType, result.assign, false);
            }
        }

        const decl = Generator.Variables.create(node.name, value);
        return TypeString(constType, decl.name, false);
    }

    visitSharedDecl(node: ast.SharedDecl): DTypes.TypedValue {
        const atTopLevel = this.scope.inGlobalScope();

        if (!node.value) {
            if (!node.varType) throw new DSError(`'${node.name}' requires a type annotation when declared without a value`);
            const baseType = node.varType;
            if (baseType.wrapType === "shared") throw new DSError(`'${StringifyType(baseType)}' is already a shared type, remove the 'shared' qualifier`);
            const wrappedType: DTypes.Type = { ...baseType, wrapType: "shared" };
            const cppType = DTypes.toCpp(wrappedType);
            this.scope.variable_mark({ name: node.name, type: wrappedType }, atTopLevel);
            if (atTopLevel) this.globalCode += `export ${cppType} ${node.name} = {};\n`;
            const code = `${cppType} ${node.name} = {};\n`;
            return TypeString(wrappedType, atTopLevel ? "" : code, false);
        }

        const value = this.visit(node.value);
        const baseType = node.varType ?? value.type;
        if (baseType.wrapType === "shared") {
            throw new DSError(`'${StringifyType(baseType)}' is already a shared type, remove the 'shared' qualifier`);
        }

        const wrappedType: DTypes.Type = { ...baseType, wrapType: "shared" };
        this.scope.variable_mark({ name: node.name, type: wrappedType }, atTopLevel);

        if (atTopLevel) {
            const result = Generator.Variables.declareGlobal(node.name, value, wrappedType);
            if (result) {
                this.globalCode += result.forward;
                return TypeString(wrappedType, result.assign, false);
            }
        }

        const decl = Generator.Variables.create(node.name, value, wrappedType);
        return TypeString(wrappedType, decl.name, false);
    }

    visitRestrictedDecl(node: ast.RestrictedDecl): DTypes.TypedValue {
        const atTopLevel = this.scope.inGlobalScope();

        if (!node.value) {
            if (!node.varType) throw new DSError(`'${node.name}' requires a type annotation when declared without a value`);
            const finalType: DTypes.Type = { ...node.varType, restricted: true };
            const cppType = DTypes.toCpp(finalType);
            this.scope.variable_mark({ name: node.name, type: finalType }, atTopLevel);
            const code = `${cppType} ${node.name} = {};\n`;
            if (atTopLevel) this.globalCode += `export ${cppType} ${node.name} = {};\n`;
            return TypeString(finalType, atTopLevel ? "" : code, false);
        }

        const value = this.visit(node.value);
        const inferredType = node.varType ?? { ...value.type, const: false };
        const rawType = !node.varType && inferredType.wrapType === "shared"
            ? { ...inferredType, wrapType: undefined }
            : inferredType;
        const baseType: DTypes.Type = (DTypes.isStruct(rawType) || DTypes.isList(rawType)) && !rawType.wrapType && !rawType.pureCppClass
            ? { ...rawType, wrapType: "local" }
            : rawType;
        const finalType: DTypes.Type = { ...baseType, restricted: true };

        if (!atTopLevel && this.scope.variable_exists_local(node.name)) {
            throw new DSError(`Variable '${node.name}' is already declared in this scope`);
        }

        this.scope.variable_mark({ name: node.name, type: finalType }, atTopLevel);

        if (atTopLevel) {
            const result = Generator.Variables.declareGlobal(node.name, value, finalType);
            if (result) {
                this.globalCode += result.forward;
                return TypeString(finalType, result.assign, false);
            }
        }

        const decl = Generator.Variables.create(node.name, value, finalType);
        return TypeString(finalType, decl.name, false);
    }

    visitWhileStatement(node: ast.WhileStatement): DTypes.TypedValue {
        const condition = this.visit(node.condition);
        this.scope.enter(ScopeType.While);
        let body = "";
        for (const stmt of node.body) {
            body += this.visit(stmt).name;
        }
        this.scope.exit();
        return Generator.Statements.while_(condition, body);
    }

    visitRepeatStatement(node: ast.RepeatStatement): DTypes.TypedValue {
        const times = this.visit(node.times);
        this.scope.enter(ScopeType.While);
        this.scope.variable_mark({ name: node.counter, type: DTypes.resolve("Integer") });
        let body = "";
        for (const stmt of node.body) {
            body += this.visit(stmt).name;
        }
        this.scope.exit();
        const code = `for (Daisy::Integer ${node.counter} = 0; ${node.counter} < ${Unwrap(times)}; ${node.counter}++) {\n${body}}\n`;
        return TypeString({ kind: "primitive", type: DTypes.Primitive.None }, code);
    }

    visitIfStatement(node: ast.IfStatement): DTypes.TypedValue {
        const condition = this.visit(node.condition);
        this.scope.enter(ScopeType.If);
        let thenBody = "";
        for (const stmt of node.thenBranch) {
            thenBody += this.visit(stmt).name;
        }
        this.scope.exit();

        const elifBranches = node.elifBranches.map(elifBranch => {
            const elifCondition = this.visit(elifBranch.condition);
            this.scope.enter(ScopeType.If);
            let elifBody = "";
            for (const stmt of elifBranch.body) {
                elifBody += this.visit(stmt).name;
            }
            this.scope.exit();
            return { condition: elifCondition, body: elifBody };
        });

        let elseBody: string | undefined;
        if (node.elseBranch) {
            this.scope.enter(ScopeType.If);
            elseBody = "";
            for (const stmt of node.elseBranch) {
                elseBody += this.visit(stmt).name;
            }
            this.scope.exit();
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
        const fnType = this.scope.function_findType(node.name);
        if (fnType && DTypes.isFunction(fnType)) {
            if (fnType.type.cname) {
                return { name: fnType.type.cname, type: fnType };
            }
            // User-defined functions take SlaveChannel as their first arg (DAISY_FUNCTION).
            // Daisy::Threads::call() handles that internally, so wrap here to hide it.
            const wrapper = `[&](auto&&... __a){ return Daisy::Threads::call(${node.name}, std::forward<decltype(__a)>(__a)...); }`;
            return { name: wrapper, type: fnType };
        }
        const type = this.scope.variable_find(node.name);
        if (this.scope.findParentScope(ScopeType.Function) && this.scope.variable_resolvesFromGlobal(node.name) && type.wrapType != "shared" && !type.const && !type.restricted) {
            // console.log(this.scope.findParentScope(ScopeType.Function))
            DSWarn(`function accesses unshared global variable '${node.name}', consider using 'shared', 'const', or 'restricted' for thread safety`);
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
        // if((node.args as any).field == "SDL_QUIT")
        // {
        //     console.log(node)
        // }
        const object = this.visit(node.object);

        const args = node.args.map(arg => this.visit(arg));

        // Validate lambda param type against list item type
        if (DTypes.isList(object.type)) {
            const itemType = object.type.type.itemType;
            const callbackType = args[0]?.type;
            if (callbackType && DTypes.isFunction(callbackType)) {
                const firstParamType = callbackType.type.params[0]?.type;
                if (firstParamType && !DTypes.isAny(firstParamType) && !CompareTypes(firstParamType, itemType)) {
                    throw new DSError(`'${node.method}' callback parameter must be '${StringifyType(itemType)}' (the list's item type), but got '${StringifyType(firstParamType)}'`);
                }
            }
        }

        if (!DTypes.isClass(object.type)) { // @todo clean this mess up
            if (DTypes.isPrimitive(object.type) || DTypes.isList(object.type)) {
                const pm = DTypes.getPseudomethods(object.type);
                if (!pm || !pm[node.method]) {
                    throw new DSError(`Pseudomethod "${node.method}" does not exist on type "${StringifyType(object.type)}"`);
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
                        throw new DSError(`'${node.method}' requires a typed callback - the return type must be known (add '-> Type' on the lambda)`);
                    }
                    methodDef = { ...methodDef, returnType: methodDef.inferReturnType(object.type, fnReturnType) };
                }
                const minParams = methodDef.minParams ?? methodDef.params.length;
                const maxParams = methodDef.params.length;
                const selfObject = { ...object, name: Unwrap(object) };
                args.unshift(selfObject);
                if (args.length < minParams || args.length > maxParams) {
                    throw new Error(`Pseudo '${node.method}' expects ${minParams === maxParams ? minParams : `${minParams}-${maxParams}`} arguments, got ${args.length}`);
                }
                CheckArgumentTypes(args, methodDef.params, node.method);
                return Generator.Expressions.methodCall(object, methodDef, args, methodDef);
            }
            // Callable field: struct field whose type is Function<...>
            if (DTypes.isStruct(object.type)) {
                let structType = object.type;
                if (Object.keys(structType.type.properties).length === 0)
                    structType = DTypes.resolve(structType.type.name) as typeof structType;
                const fieldType = DTypes.getProperties(structType)[node.method];
                if (fieldType && DTypes.isFunction(fieldType)) {
                    const argsStr = (RemoveType(args) as string[]).join(", ");
                    return TypeString(fieldType.type.returnType, `${object.name}.${node.method}(${argsStr})`);
                }
            }
            throw new DSError(`Cannot call method "${node.method}" on non-class type "${StringifyType(object.type)}"`);
        }

        const methodDef = object.type.type.methods?.[node.method];
        if (!methodDef) {
            throw new DSError(`Method '${node.method}' not found on class '${object.type.type.name}'`);
        }

        if (methodDef.isPseudomethod && methodDef.params[0]?.name === "self") {
            args.unshift({ ...object, name: Unwrap(object) });
        }

        const minParams = methodDef.minParams ?? methodDef.params.length;
        const maxParams = methodDef.params.length;

        if (args.length < minParams || args.length > maxParams) {
            throw new DSError(`Method '${node.method}' expects ${minParams === maxParams ? minParams : `${minParams}-${maxParams}`} arguments, got ${args.length}`);
        }

        CheckArgumentTypes(args, methodDef.params, node.method);

        return Generator.Expressions.methodCall(object, methodDef, args, methodDef);
    }

    visitFunctionCall(node: ast.FunctionCall): DTypes.TypedValue {
        if (node.name == 'cppInclude') {
            if (node.args.length != 1 || node.args[0].type != 'StringLiteral') {
                throw new DSError(`cppInclude() expects a single string literal argument`);
            }
            const relPath = unescapeString((node.args[0] as ast.StringLiteral).value);
            const src = path.resolve(relPath);
            const basename = path.basename(src);
            this.localIncludes.push({ src, basename });
            this.includeCode += `#include "${src}"\n`;
            return { name: "", type: { kind: "primitive", type: DTypes.Primitive.None } };
        }
        else if (node.name == 'cpp') {
            // console.log("HIIII", node.args[0])
            if (node.args.length == 2) {
                const returnType = this.visit(node.args[0]).type;
                const expr = unescapeString((node.args[1] as ast.StringLiteral).value);
                return { name: expr, type: returnType };
            }
            if (node.args.length != 1 || node.args[0].type != 'StringLiteral') {
                throw new DSError(`cpp() expects a string literal, or a return type followed by a string literal`);
            }
            const s = unescapeString((node.args[0] as ast.StringLiteral).value) + "\n";
            if(this.scope.inGlobalScope())
            {
                this.includeCode += s;
            }
            else
            {
                this.executableCode += s;
            }
            return { name: "", type: { kind: "primitive", type: DTypes.Primitive.None } };
        }
        else if (node.name == 'cppCall') {
            if(node.args.length < 2)
            {
                throw new DSError("cppCall needs at least two parameters (return type, then function name)")
            }

            const func: DTypes.Function = {
                returnType: this.visit(node.args[0]).type,
                cname: (node.args[1] as ast.StringLiteral).value,
                params: [],
                name: ""
            } 

            return Generator.Functions.call(func, node.args.slice(2).map(x =>this.visit(x)));
        }
        else if(node.name == 'cppIdentifier') {
            if (node.args.length == 2) {
                const type = this.visit(node.args[0]).type;
                const name = unescapeString((node.args[1] as ast.StringLiteral).value);
                 this.scope.variable_mark({name,type});
                 this.exports.push({ kind: 'variable', name, varType: type }); // @todo shouldnt always export but for now
                //  return { name, type };
                return { name: "", type: { kind: "primitive", type: DTypes.Primitive.None } };
            }
            else
            {
                throw new DSError("Bad arguments")
            }
        }

        const func = this.scope.function_find(node.name);
        const args = node.args.map(arg => this.visit(arg));

        const minParams = func.minParams ?? func.params.length;
        const maxParams = func.params.length;

        if (args.length < minParams || (!func.variadic && args.length > maxParams)) {
            throw new DSError(`Function '${func.name}' expects ${minParams === maxParams ? minParams : `${minParams}-${maxParams}`} arguments, got ${args.length}`);
        }

        CheckArgumentTypes(args, func.params, func.name, func.variadic);

        const resolvedFunc = func.inferReturnTypeFromArgs
            ? { ...func, returnType: func.inferReturnTypeFromArgs(args) }
            : func;
        return Generator.Functions.call(resolvedFunc, args);
    }

    visitExprCall(node: ast.ExprCall): DTypes.TypedValue {
        const callee = this.visit(node.callee);

        if (!DTypes.isFunction(callee.type)) {
            throw new DSError(`Cannot call non-function value of type '${StringifyType(callee.type)}'`);
        }

        const funcType = callee.type.type;
        const args = node.args.map(arg => this.visit(arg));

        const minParams = funcType.minParams ?? funcType.params.length;
        const maxParams = funcType.params.length;
        if (args.length < minParams || (!funcType.variadic && args.length > maxParams)) {
            throw new DSError(`'${callee.name}' expects ${minParams === maxParams ? minParams : `${minParams}-${maxParams}`} arguments, got ${args.length}`);
        }

        CheckArgumentTypes(args, funcType.params, funcType.name || callee.name, funcType.variadic);
        const argsStr = (RemoveType(args) as string[]).join(", ");
        return TypeString(funcType.returnType, `${callee.name}(${argsStr})`);
    }

    visitLambdaExpr(node: ast.LambdaExpr): DTypes.TypedValue {
        this.scope.enter(ScopeType.If);
        for (const p of node.params) {
            this.scope.variable_mark({ name: p.name, type: p.type ?? { kind: 'any' } });
        }
        const body = this.visit(node.body);
        this.scope.exit();
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

    // Resolves any call-expression node to its function definition + evaluated args.
    // Handles FunctionCall, MethodCall (class methods and pseudomethods), and any
    // future call-shaped nodes - so callers like visitSpawnExpr stay generic.
    private resolveCallTarget(node: ast.Expression, line?: number): { func: DTypes.Function; args: DTypes.TypedValue[] } {
        if (node.type === 'FunctionCall') {
            const n = node as ast.FunctionCall;
            const func = this.scope.function_find(n.name);
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

            // Callable field: struct field whose type is Function<...>
            if (DTypes.isStruct(object.type)) {
                let structType = object.type;
                if (Object.keys(structType.type.properties).length === 0)
                    structType = DTypes.resolve(structType.type.name) as typeof structType;
                const fieldType = DTypes.getProperties(structType)[n.method];
                if (fieldType && DTypes.isFunction(fieldType)) {
                    const syntheticFunc: DTypes.Function = {
                        ...fieldType.type,
                        cname: `${object.name}.${n.method}`,
                        name: `${object.name}.${n.method}`,
                    };
                    return { func: syntheticFunc, args };
                }
            }

            const pm = DTypes.getPseudomethods(object.type);
            const methodDef = pm?.[n.method];
            if (!methodDef) throw new DSError(`Pseudomethod '${n.method}' not found on '${StringifyType(object.type)}'`, line);
            return { func: methodDef, args: [object, ...args] };
        }

        if (node.type === 'ExprCall') {
            const n = node as ast.ExprCall;
            const callee = this.visit(n.callee);
            const args = n.args.map(arg => this.visit(arg));

            if (!DTypes.isFunction(callee.type)) {
                throw new DSError(`Cannot spawn non-function value of type '${StringifyType(callee.type)}'`, line);
            }

            const syntheticFunc: DTypes.Function = {
                ...callee.type.type,
                cname: callee.name,
                name: callee.name,
            };
            return { func: syntheticFunc, args };
        }

        throw new DSError("Spawn requires a call expression", line);
    }

    visitSpawnExpr(node: ast.SpawnExpr): DTypes.TypedValue {
        const { func, args } = this.resolveCallTarget(node.expression);

        const minParams = func.minParams ?? func.params.length;
        const maxParams = func.params.length;
        if (args.length < minParams || args.length > maxParams) {
            throw new DSError(`'${func.name}' expects ${minParams === maxParams ? minParams : `${minParams}-${maxParams}`} arguments, got ${args.length}`);
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

    visitNegExpr(node: ast.NegExpr): DTypes.TypedValue {
        const expr = this.visit(node.expression);
        return { name: `-${expr.name}`, type: expr.type };
    }

    visitNoneExpr(node: ast.NoneExpr): DTypes.TypedValue {
        // @todo implement none expression code generation
        return { name: "", type: { kind: "primitive", type: DTypes.Primitive.None } };
    }


    visitFieldAccess(node: ast.FieldAccess, setterValue?: DTypes.TypedValue): DTypes.TypedValue {
        const rawObject = this.visit(node.object);
        const field = node.field;

        // Re-resolve struct types - the AST may hold a forward-reference with empty properties
        // from CSTPrinter time (before visitTypeDef ran and called DTypes.declare).
        let objectType = rawObject.type;
        // Only re-resolve forward references (empty properties). Generic structs like
        // TimeoutResponse<T> already have properties populated at instantiation time.
        if (DTypes.isStruct(objectType) && Object.keys(objectType.type.properties).length === 0) {
            const fresh = DTypes.resolve(objectType.type.name);
            objectType = { ...fresh, wrapType: objectType.wrapType };
        }
        const object = { ...rawObject, type: objectType };

        // console.log(object.type)

        const properties = DTypes.getProperties(object.type);

        // console.log(object);
        if (!(field in properties)) {
            throw new DSError(`Field "${field}" does not exist on type "${(object as any)?.type?.type?.name}"`); // @todo cleanup, but should be safeish
        }

        const found = properties[field];

        if (setterValue && object.type.const) {
            throw new DSError(`Cannot mutate field '${field}' of const '${object.name}'`);
        }

        if (setterValue && !CompareTypes(setterValue.type, found)) {
            throw new DSError(`Array expects type "${DTypes.toCpp(found)}" but setting with type "${DTypes.toCpp(setterValue.type)}"`);
        }

        const res = Generator.Expressions.propertyAccess(object, field, found, setterValue);
        // console.log(res)
        // process.exit()

        return res;
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

        // if (setterValue && object.type.const) {
        //     throw new DSError(`Cannot mutate index of const '${object.name}'`);
        // }

        if (setterValue && !CompareTypes(setterValue.type, itemType)) {
            throw new DSError(`Array expects type "${DTypes.toCpp(itemType)}" but setting with type "${DTypes.toCpp(setterValue.type)}"`);
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
            throw new DSError(`Entry number [${foundDifferent}] is of type "${StringifyType(entries[foundDifferent].type)}" but expected a "${StringifyType(referenceType)}"`);
        }

        return Generator.Expressions.arrayLiteral(entries);
    }

    visitAssignmentExpr(node: ast.AssignmentExpr): DTypes.TypedValue {
        const value = this.visit(node.value);

        let targetName: string;
        let varType: DTypes.Type;

        if (node.target.type === 'IndexAccess') {
            return this.visitIndexAccess(node.target, value);
        }

        if (node.target.type === 'FieldAccess') {
            // @todo implement field assignment code generation
            return this.visitFieldAccess(node.target, value)
            // return { name: "", type: { kind: "primitive", type: DTypes.Primitive.None } };
        }

        else {
            targetName = node.target.name;
            varType = this.scope.variable_find(targetName);
            if (varType.const) {
                throw new DSError(`Cannot modify constant '${targetName}'`);
            }
            if (varType.restricted && this.scope.findParentScope(ScopeType.Function)) {
                throw new DSError(`Cannot modify restricted variable '${targetName}' inside a function`);
            }
        }

        if (!CompareTypes(value.type, varType)) {
            throw new DSError(`Cannot assign ${StringifyType(value.type)} to variable '${node.target.name}' of type ${StringifyType(varType)}`);
        }

        return Generator.Statements.assignment(node.target.name, value, varType);
    }

    visitExportDeclaration(node: ast.ExportDeclaration): DTypes.TypedValue {

        if(!this.scope.inGlobalScope())
        {
            throw new DSError(`Cannot export a something in a local scope`)
        }

        const result = this.visit(node.declaration);

        switch (node.declaration.type) {
            case 'FunctionDef': {
                const func = this.scope.function_find(node.declaration.name);
                this.exports.push({ kind: 'function', name: node.declaration.name, func });
                break;
            }
            case 'LetStatement':
            case 'ConstDecl':
            case 'SharedDecl': {
                const varType = this.scope.variable_find(node.declaration.name);
                this.exports.push({ kind: 'variable', name: node.declaration.name, varType });
                break;
            }
            case 'TypeDef': {
                const typeVal = DTypes.resolve(node.declaration.name);
                this.exports.push({ kind: 'type', name: node.declaration.name, typeVal });
                break;
            }
        }

        return result;
    }

    visitImportStatement(node: ast.ImportStatement): DTypes.TypedValue {
        const importPath = require('path').resolve(
            require('path').dirname(this.sourceFile ?? ''),
            node.path.endsWith('.bud') ? node.path : node.path + '.bud'
        );

        let imported: Walker;
        if (session.importCache.has(importPath)) {
            DSWarn(`Circular import of "${importPath}". SKIPPING!`);
            return TypeString(DTypes.resolve("None"), "");
        } else {
            const fs = require('fs');
            const { DaisyParser } = require('../parser');
            const { addEnds } = require('../parser/indent');

            let contents: string;
            try {
                contents = fs.readFileSync(importPath, 'utf-8');
            }
            catch (e) {
                throw new DSError(`Could not open file "${importPath}"`);
            }

            const processedLines = addEnds(contents);
            const source = processedLines.map((l: any) => l.content).join('\n');
            const lineMap = processedLines.map((l: any) => l.lineNumber);
            const moduleAst = new DaisyParser().parse(source, lineMap);

            session.inputFileStack.enter(importPath); // @todo cleanup
            session.lineNumberStack.enter(1);
            imported = new Walker();
            imported.sourceFile = importPath;
            imported.visit(moduleAst);
            session.inputFileStack.exit();
            session.lineNumberStack.exit();

            session.importCache.set(importPath, imported);
        }

        // @todo maybe compile seperatley? slower but more correct. whole reason I switched to modules

        this.globalCode += imported.globalCode;
        this.executableCode += imported.executableCode;
        this.includeCode += imported.includeCode;

        // build namespace
        const methods: DTypes.MarkedFunctions = {};
        const properties: DTypes.MarkedTypes = {};

        for (const exp of imported.exports) {
            if (exp.kind === 'function') {
                // keep cname only if it was a builtin; user functions go through Daisy::Threads::call
                methods[exp.name] = { ...exp.func, isPseudomethod: true };
            } else if (exp.kind === 'variable') {
                properties[exp.name] = exp.varType;
            } else if (exp.kind === 'type') {
                DTypes.declare(exp.name, exp.typeVal);
            }
        }

        const nsType: DTypes.Type = { kind: 'class', type: { name: node.namespace, properties, methods }, const: true };
        this.scope.variable_mark({ name: node.namespace, type: nsType });

        return TypeString(DTypes.resolve("None"), "");
    }
}
