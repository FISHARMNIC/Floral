import * as ast from './ast';
import { DTypes } from '../compiler/DTypes';
import { DSError } from '../compiler/DSError';
import { DaisyParser } from './index';

export class CSTPrinter {
  constructor(private lineMap: number[] = [], private parser?: DaisyParser) {}

  visit(cst: any): ast.Program {
    return this.visitProgram(cst);
  }

  private lineOf(children: any): number | undefined {
    for (const key of Object.keys(children)) {
      const arr = children[key];
      if (!Array.isArray(arr) || arr.length === 0) continue;
      const first = arr[0];
      if (typeof first?.startLine === 'number') {
        const original = this.lineMap[first.startLine - 1];
        return original || undefined;
      }
    }
    return undefined;
  }

  private visitBlock(blockNode: any): ast.Statement[] {
    const body: ast.Statement[] = [];
    if (blockNode?.children?.statement) {
      for (const stmt of blockNode.children.statement) {
        const result = this.visitStatement(stmt.children);
        if (result) body.push(result);
      }
    }
    return body;
  }

  private visitParamList(children: any): ast.Param[] {
    const params: ast.Param[] = [];
    if (children.paramList) {
      const paramListNode = children.paramList[0];
      if (paramListNode.children?.param) {
        for (const p of paramListNode.children.param) {
          const paramName = p.children.Identifier[0].image;
          const paramType = p.children.type?.length ? this.getType(p.children.type[0].children) : undefined;
          params.push({ name: paramName, type: paramType });
        }
      }
    }
    return params;
  }

  private foldBinaryExpr(
    children: any,
    childKey: string,
    visitChild: (c: any) => ast.Expression,
    opDefs: { key: string; image: string }[]
  ): ast.Expression {
    const line = this.lineOf(children);
    const opTokens = opDefs
      .flatMap(({ key, image }) => (children[key] || []).map((t: any) => ({ image, startOffset: t.startOffset })))
      .sort((a, b) => a.startOffset - b.startOffset);

    let expr = visitChild(children[childKey][0].children);
    for (let i = 0; i < opTokens.length; i++) {
      const right = visitChild(children[childKey][i + 1].children);
      expr = { type: 'BinaryOp', left: expr, op: opTokens[i].image, right, line } as ast.BinaryOp;
    }
    return expr;
  }

  visitProgram(cst: any): ast.Program {
    const statements: ast.Statement[] = [];
    if (cst.children?.statement) {
      for (const stmt of cst.children.statement) {
        const result = this.visitStatement(stmt.children);
        if (result) statements.push(result);
      }
    }
    return { type: 'Program', statements };
  }

  visitStatement(children: any): ast.Statement | null {
    if (!children) return null;
    if (children.importStatement)    return this.visitImportStatement(children.importStatement[0].children);
    if (children.exportDeclaration)  return this.visitExportDeclaration(children.exportDeclaration[0].children);
    if (children.includeStat)        return this.visitIncludeStat(children.includeStat[0].children);
    if (children.typeDef)            return this.visitTypeDef(children.typeDef[0].children);
    if (children.sharedDecl)         return this.visitSharedDecl(children.sharedDecl[0].children);
    if (children.constDecl)          return this.visitConstDecl(children.constDecl[0].children);
    if (children.functionDef)        return this.visitFunctionDef(children.functionDef[0].children);
    if (children.whileStatement)     return this.visitWhileStatement(children.whileStatement[0].children);
    if (children.repeatStatement)    return this.visitRepeatStatement(children.repeatStatement[0].children);
    if (children.ifStatement)        return this.visitIfStatement(children.ifStatement[0].children);
    if (children.letStatement)       return this.visitLetStatement(children.letStatement[0].children);
    if (children.returnStatement)    return this.visitReturnStatement(children.returnStatement[0].children);
    if (children.breakStatement)     return this.visitBreakStatement(children.breakStatement[0].children);
    if (children.expressionStatement) return this.visitExpressionStatement(children.expressionStatement[0].children);
    return null;
  }

  visitImportStatement(children: any): ast.ImportStatement {
    const path = children.StringLiteral[0].image.slice(1, -1);
    const namespace = children.Identifier[0].image;
    return { type: 'ImportStatement', path, namespace, line: this.lineOf(children) };
  }

  visitExportDeclaration(children: any): ast.ExportDeclaration {
    let declaration: ast.ExportableDeclaration;
    if (children.functionDef)  declaration = this.visitFunctionDef(children.functionDef[0].children);
    else if (children.letStatement)  declaration = this.visitLetStatement(children.letStatement[0].children);
    else if (children.constDecl)     declaration = this.visitConstDecl(children.constDecl[0].children);
    else if (children.sharedDecl)    declaration = this.visitSharedDecl(children.sharedDecl[0].children);
    else                             declaration = this.visitTypeDef(children.typeDef[0].children);
    return { type: 'ExportDeclaration', declaration, line: this.lineOf(children) };
  }

  visitIncludeStat(children: any): ast.IncludeStatement {
    const includes = (children.StringLiteral || []).map((s: any) => s.image.slice(1, -1));
    return { type: 'IncludeStatement', includes, line: this.lineOf(children) };
  }

  visitFunctionDef(children: any): ast.FunctionDef {
    const name = children.Identifier[0].image;
    const params = this.visitParamList(children);
    const returnType = children.type ? this.getType(children.type[0].children) : DTypes.resolve('None');
    const body = children.block ? this.visitBlock(children.block[0]) : [];
    return { type: 'FunctionDef', name, params, returnType, body, line: this.lineOf(children) };
  }

  visitLetStatement(children: any): ast.LetStatement {
    const name = children.Identifier[0].image;
    const value = children.expression?.length ? this.visitExpression(children.expression[0].children) : undefined;
    const varType = children.type ? this.getType(children.type[0].children) : undefined;
    return { type: 'LetStatement', name, value, varType, line: this.lineOf(children) };
  }

  visitReturnStatement(children: any): ast.ReturnStatement {
    const expression = this.visitExpression(children.expression[0].children);
    return { type: 'ReturnStatement', expression, line: this.lineOf(children) };
  }

  visitTypeDef(children: any): ast.TypeDef {
    const name = children.Identifier[0].image;
    const fields: ast.TypeField[] = [];
    if (children.typeFieldList) {
      const fieldListNode = children.typeFieldList[0];
      if (fieldListNode.children?.typeField) {
        for (const field of fieldListNode.children.typeField) {
          const fieldType = this.getType(field.children.type[0].children);
          fields.push({ name: field.children.Identifier[0].image, fieldType });
        }
      }
    }
    return { type: 'TypeDef', name, fields, line: this.lineOf(children) };
  }

  visitConstDecl(children: any): ast.ConstDecl {
    const name = children.Identifier[0].image;
    const value = this.visitExpression(children.expression[0].children);
    return { type: 'ConstDecl', name, value, line: this.lineOf(children) };
  }

  visitSharedDecl(children: any): ast.SharedDecl {
    const name = children.Identifier[0].image;
    const value = children.expression?.length ? this.visitExpression(children.expression[0].children) : undefined;
    const varType = children.type?.length ? this.getType(children.type[0].children) : undefined;
    return { type: 'SharedDecl', name, value, varType, line: this.lineOf(children) };
  }

  visitWhileStatement(children: any): ast.WhileStatement {
    const condition = this.visitExpression(children.expression[0].children);
    const body = children.block ? this.visitBlock(children.block[0]) : [];
    return { type: 'WhileStatement', condition, body, line: this.lineOf(children) };
  }

  visitRepeatStatement(children: any): ast.RepeatStatement {
    const counter = children.Identifier[0].image;
    const times = this.visitExpression(children.expression[0].children);
    const body = children.block ? this.visitBlock(children.block[0]) : [];
    return { type: 'RepeatStatement', counter, times, body, line: this.lineOf(children) };
  }

  visitIfStatement(children: any): ast.IfStatement {
    const condition = this.visitExpression(children.expression[0].children);
    const thenBranch = this.visitBlock(children.block?.[0]);

    const elifBranches: ast.ElifBranch[] = [];
    let elifIdx = 1;
    if (children.Elif) {
      for (let i = 0; i < children.Elif.length; i++) {
        const elifCondition = this.visitExpression(children.expression[elifIdx].children);
        const elifBody = this.visitBlock(children.block?.[elifIdx]);
        elifBranches.push({ condition: elifCondition, body: elifBody });
        elifIdx++;
      }
    }

    const elseBranch = children.Else ? this.visitBlock(children.block?.[elifIdx]) : undefined;

    return { type: 'IfStatement', condition, thenBranch, elifBranches, elseBranch, line: this.lineOf(children) };
  }

  visitBreakStatement(children: any): ast.BreakStatement {
    return { type: 'BreakStatement', line: this.lineOf(children) };
  }

  visitExpressionStatement(children: any): ast.ExpressionStatement {
    const expression = this.visitExpression(children.expression[0].children);
    return { type: 'ExpressionStatement', expression, line: this.lineOf(children) };
  }

  visitExpression(children: any): ast.Expression {
    return this.visitAssignmentExpr(children.assignmentExpr[0].children);
  }

  visitAssignmentExpr(children: any): ast.Expression {
    let expr = this.visitLogicalOrExpr(children.logicalOrExpr[0].children);
    if (children.Equals?.length) {
      if (expr.type !== 'Identifier' && expr.type !== 'IndexAccess' && expr.type !== 'FieldAccess') {
        throw new Error("Assignment target must be an identifier, index, or field access");
      }
      const value = this.visitLogicalOrExpr(children.logicalOrExpr[1].children);
      return { type: 'AssignmentExpr', target: expr as ast.Identifier | ast.IndexAccess | ast.FieldAccess, value, line: this.lineOf(children) } as ast.AssignmentExpr;
    }
    return expr;
  }

  visitLogicalOrExpr(children: any): ast.Expression {
    return this.foldBinaryExpr(children, 'logicalAndExpr', c => this.visitLogicalAndExpr(c),
      [{ key: 'OrOr', image: '||' }]);
  }

  visitLogicalAndExpr(children: any): ast.Expression {
    return this.foldBinaryExpr(children, 'comparisonExpr', c => this.visitComparisonExpr(c),
      [{ key: 'AndAnd', image: '&&' }]);
  }

  visitComparisonExpr(children: any): ast.Expression {
    return this.foldBinaryExpr(children, 'addExpr', c => this.visitAddExpr(c), [
      { key: 'EqualEqual',   image: '==' },
      { key: 'NotEqual',     image: '!=' },
      { key: 'LessEqual',    image: '<=' },
      { key: 'GreaterEqual', image: '>=' },
      { key: 'Less',         image: '<'  },
      { key: 'Greater',      image: '>'  },
    ]);
  }

  visitAddExpr(children: any): ast.Expression {
    return this.foldBinaryExpr(children, 'mulExpr', c => this.visitMulExpr(c), [
      { key: 'Plus',  image: '+' },
      { key: 'Minus', image: '-' },
    ]);
  }

  visitMulExpr(children: any): ast.Expression {
    return this.foldBinaryExpr(children, 'unaryExpr', c => this.visitUnaryExpr(c), [
      { key: 'Star',  image: '*' },
      { key: 'Slash', image: '/' },
    ]);
  }

  visitUnaryExpr(children: any): ast.Expression {
    const line = this.lineOf(children);
    if (children.Spawn) return { type: 'SpawnExpr',  expression: this.visitUnaryExpr(children.unaryExpr[0].children), line } as ast.SpawnExpr;
    if (children.Await) return { type: 'AwaitExpr',  expression: this.visitUnaryExpr(children.unaryExpr[0].children), line } as ast.AwaitExpr;
    if (children.Bang)  return { type: 'NotExpr',    expression: this.visitUnaryExpr(children.unaryExpr[0].children), line } as ast.NotExpr;
    if (children.Minus) return { type: 'NegExpr',    expression: this.visitUnaryExpr(children.unaryExpr[0].children), line } as ast.NegExpr;
    return this.visitPostfixExpr(children.postfixExpr[0].children);
  }

  visitPostfixExpr(children: any): ast.Expression {
    const line = this.lineOf(children);
    let expr = this.visitPrimary(children.primary[0].children);

    let dotCount = 0, colonCount = 0, parenCount = 0, argListCount = 0;
    const dotTokens    = children.Dot       || [];
    const colonTokens  = children.Colon     || [];
    const parenTokens  = children.LParen    || [];
    const bracketTokens = children.LBracket || [];
    const indexExprs   = children.expression || [];
    let bracketCount = 0, indexExprCount = 0;

    const allNames = [
      ...(children.Identifier || []).map((t: any) => ({ image: t.image })),
      ...(children.String   || []).map((_t: any) => ({ image: 'String'  })),
      ...(children.Integer  || []).map((_t: any) => ({ image: 'Integer' })),
      ...(children.Boolean  || []).map((_t: any) => ({ image: 'Boolean' })),
      ...(children.Float    || []).map((_t: any) => ({ image: 'Float'   })),
    ];
    let nameIdx = 0;

    const total = dotTokens.length + colonTokens.length + parenTokens.length + bracketTokens.length;
    for (let i = 0; i < total; i++) {
      const nextDotOff     = dotCount     < dotTokens.length     ? dotTokens[dotCount].startOffset         : Infinity;
      const nextColonOff   = colonCount   < colonTokens.length   ? colonTokens[colonCount].startOffset     : Infinity;
      const nextParenOff   = parenCount   < parenTokens.length   ? parenTokens[parenCount].startOffset     : Infinity;
      const nextBracketOff = bracketCount < bracketTokens.length ? bracketTokens[bracketCount].startOffset : Infinity;
      const minOff = Math.min(nextDotOff, nextColonOff, nextBracketOff, nextParenOff);

      if (nextBracketOff === minOff) {
        const index = this.visitExpression(indexExprs[indexExprCount++].children);
        expr = { type: 'IndexAccess', object: expr, index, line } as ast.IndexAccess;
        bracketCount++;
      } else if (nextDotOff === minOff) {
        const methodName = allNames[nameIdx++]?.image || 'unknown';
        const nextParenOffset = parenTokens[parenCount]?.startOffset ?? Infinity;
        const nextDotOffset   = dotTokens[dotCount + 1]?.startOffset ?? Infinity;
        const parenBelongsHere = parenCount < parenTokens.length && nextParenOffset < nextDotOffset;
        if (parenBelongsHere) {
          const args = argListCount < (children.argList?.length || 0) ? this.visitArgList(children.argList[argListCount++].children) : [];
          expr = { type: 'MethodCall', object: expr, method: methodName, args, line } as ast.MethodCall;
          parenCount++;
          i++;
        } else {
          expr = { type: 'FieldAccess', object: expr, field: methodName, line } as ast.FieldAccess;
        }
        dotCount++;
      } else if (nextColonOff === minOff) {
        const methodName = allNames[nameIdx++]?.image || 'unknown';
        const args = (parenCount < parenTokens.length && argListCount < (children.argList?.length || 0))
          ? this.visitArgList(children.argList[argListCount++].children)
          : [];
        if (parenCount < parenTokens.length) { parenCount++; i++; }
        expr = { type: 'MethodCall', object: expr, method: methodName, args, line } as ast.MethodCall;
        colonCount++;
      } else if (nextParenOff === minOff) {
        const args = argListCount < (children.argList?.length || 0) ? this.visitArgList(children.argList[argListCount++].children) : [];
        if (expr.type === 'Identifier') {
          expr = { type: 'FunctionCall', name: (expr as ast.Identifier).name, args, line } as ast.FunctionCall;
        } else {
          expr = { type: 'ExprCall', callee: expr, args, line } as ast.ExprCall;
        }
        parenCount++;
      }
    }

    return expr;
  }

  visitArgList(children: any): ast.Expression[] {
    return (children.expression || []).map((e: any) => this.visitExpression(e.children));
  }

  visitPrimary(children: any): ast.Expression {
    const line = this.lineOf(children);
    if (children.Identifier)    return { type: 'Identifier', name: children.Identifier[0].image, line };
    if (children.IntegerLiteral) return { type: 'IntegerLiteral', value: parseInt(children.IntegerLiteral[0].image), line };
    if (children.FloatLiteral)  return { type: 'FloatLiteral', value: parseFloat(children.FloatLiteral[0].image.replace(/f$/, '')), line };
    if (children.StringLiteral) {
      const raw = children.StringLiteral[0].image;
      const content = raw.slice(1, -1);
      if (content.includes('${')) return this.visitInterpolatedString(content, line);
      return { type: 'StringLiteral', value: content, line };
    }
    if (children.True)          return { type: 'BooleanLiteral', value: true, line };
    if (children.False)         return { type: 'BooleanLiteral', value: false, line };
    if (children.None)          return { type: 'NoneExpr', line };
    if (children.lambda)        return this.visitLambda(children.lambda[0].children);
    if (children.listLiteral)   return this.visitListLiteral(children.listLiteral[0].children);
    if (children.structLiteral) return this.visitStructLiteral(children.structLiteral[0].children);
    if (children.expression)    return { type: 'GroupExpr', expression: this.visitExpression(children.expression[0].children), line } as ast.GroupExpr;
    return { type: 'Identifier', name: 'unknown', line };
  }

  visitListLiteral(children: any): ast.ListLiteral {
    const elements = (children.expression || []).map((e: any) => this.visitExpression(e.children));
    return { type: 'ListLiteral', elements, line: this.lineOf(children) };
  }

  visitStructLiteral(children: any): ast.StructLiteral {
    const structName = children.Identifier[0].image;
    const fields = (children.structField || []).map((f: any) => ({
      name: f.children.Identifier[0].image,
      value: this.visitExpression(f.children.expression[0].children),
    }));
    return { type: 'StructLiteral', structName, fields, line: this.lineOf(children) };
  }

  // Splits "hello ${name} world ${x + 1}" into alternating strings and parsed expressions.
  // `this.parser` is available for re-parsing inner expression strings.
  visitInterpolatedString(content: string, line?: number): ast.InterpolatedString {
    const parts: Array<string | ast.Expression> = [];
    const re = /\$\{([^}]*)\}/g;
    let last = 0, match: RegExpExecArray | null;
    while ((match = re.exec(content)) !== null) {
      if (match.index > last) parts.push(content.slice(last, match.index));
      parts.push(this.parser ? this.parser.parseExpression(match[1]) : match[1]);
      last = match.index + match[0].length;
    }
    if (last < content.length) parts.push(content.slice(last));
    return { type: 'InterpolatedString', parts, line };
  }

  visitLambda(children: any): ast.LambdaExpr {
    const params = this.visitParamList(children);
    const returnType = children.type?.length ? this.getType(children.type[0].children) : undefined;
    const body = this.visitExpression(children.expression[0].children);
    return { type: 'LambdaExpr', params, body, returnType, line: this.lineOf(children) };
  }

  getType(children: any): DTypes.Type {
    const isShared = (children.Dollar?.length > 0) || (children.Shared?.length > 0);
    const isConst = children.Const?.length > 0;

    let typeName = 'None';
    if (children.Identifier)          typeName = children.Identifier[0].image;
    else if (children.String)         typeName = 'String';
    else if (children.Integer || children.Int) typeName = 'Integer';
    else if (children.Boolean)        typeName = 'Boolean';
    else if (children.Float)          typeName = 'Float';

    let resolved: DTypes.Type;
    if (children.type?.length) {
      if (typeName === 'Function') {
        const returnType = this.getType(children.type[0].children);
        const paramTypes: DTypes.Type[] = children.type.slice(1).map((t: any) => this.getType(t.children));
        resolved = {
          kind: 'function',
          type: {
            name: 'Function',
            params: paramTypes.map((t, i) => ({ name: `arg${i}`, type: t })),
            returnType
          }
        };
      } else {
        const innerType = this.getType(children.type[0].children);
        // @todo CLEAN UP!!!
        if (innerType.wrapType === "shared" && !((innerType as any)?.type?.name.includes("Daisy::Threads::Handler"))) {
          throw new DSError(`Shared type cannot be used as a sub-type, use $${typeName}<...> instead of ${typeName}<$...>`);
        }
        resolved = DTypes.resolveGeneric(typeName, innerType);
      }
    } else {
      resolved = DTypes.resolve(typeName);
    }

    if (isShared) return { ...resolved, wrapType: "shared" as const };
    if (isConst) return { ...resolved, const: true };
    return resolved;
  }
}
