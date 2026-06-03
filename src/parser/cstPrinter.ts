import * as ast from './ast';
import { DTypes } from '../compiler/DTypes';
import { DSError } from '../compiler/DSError';

export class CSTPrinter {
  visit(cst: any): ast.Program {
    return this.visitProgram(cst);
  }

  visitProgram(cst: any): ast.Program {
    const statements: ast.Statement[] = [];

    if (cst.children && cst.children.statement) {
      for (const stmt of cst.children.statement) {
        const result = this.visitStatement(stmt.children);
        if (result) {
          statements.push(result);
        }
      }
    }

    return { type: 'Program', statements };
  }

  visitStatement(children: any): ast.Statement | null {
    if (!children) return null;

    if (children.includeStat) return this.visitIncludeStat(children.includeStat[0].children);
    if (children.typeDef) return this.visitTypeDef(children.typeDef[0].children);
    if (children.sharedDecl) return this.visitSharedDecl(children.sharedDecl[0].children);
    if (children.constDecl) return this.visitConstDecl(children.constDecl[0].children);
    if (children.functionDef) return this.visitFunctionDef(children.functionDef[0].children);
    if (children.whileStatement) return this.visitWhileStatement(children.whileStatement[0].children);
    if (children.ifStatement) return this.visitIfStatement(children.ifStatement[0].children);
    if (children.cppStatement) return this.visitCppStatement(children.cppStatement[0].children);
    if (children.letStatement) return this.visitLetStatement(children.letStatement[0].children);
    if (children.returnStatement) return this.visitReturnStatement(children.returnStatement[0].children);
    if (children.breakStatement) return this.visitBreakStatement(children.breakStatement[0].children);
    if (children.expressionStatement) return this.visitExpressionStatement(children.expressionStatement[0].children);

    return null;
  }

  visitIncludeStat(children: any): ast.IncludeStatement {
    const includes: string[] = [];
    if (children.StringLiteral) {
      for (const str of children.StringLiteral) {
        includes.push(str.image.slice(1, -1));
      }
    }
    return { type: 'IncludeStatement', includes };
  }

  visitFunctionDef(children: any): ast.FunctionDef {
    const name = children.Identifier[0].image;
    const params: ast.Param[] = [];
    let returnType: DTypes.Type = DTypes.resolve('None');

    if (children.paramList) {
      const paramListNode = children.paramList[0];
      if (paramListNode.children && paramListNode.children.param) {
        for (const p of paramListNode.children.param) {
          const paramName = p.children.Identifier[0].image;
          const paramType = p.children.type ? this.getType(p.children.type[0].children) : undefined;
          params.push({ name: paramName, type: paramType });
        }
      }
    }

    if (children.type) {
      returnType = this.getType(children.type[0].children);
    }

    const body: ast.Statement[] = [];
    if (children.block) {
      const blockNode = children.block[0];
      if (blockNode.children && blockNode.children.statement) {
        for (const stmt of blockNode.children.statement) {
          const result = this.visitStatement(stmt.children);
          if (result) {
            body.push(result);
          }
        }
      }
    }

    return { type: 'FunctionDef', name, params, returnType, body };
  }

  visitLetStatement(children: any): ast.LetStatement {
    const name = children.Identifier[0].image;
    const value = this.visitExpression(children.expression[0].children);

    let varType: DTypes.Type | undefined;
    if (children.type) {
      varType = this.getType(children.type[0].children);
    }

    return { type: 'LetStatement', name, value, varType };
  }

  visitReturnStatement(children: any): ast.ReturnStatement {
    const expression = this.visitExpression(children.expression[0].children);
    return { type: 'ReturnStatement', expression };
  }

  visitCppStatement(children: any): ast.CppStatement {
    const code = children.StringLiteral[0].image.slice(1, -1);
    return { type: 'CppStatement', code };
  }

  visitTypeDef(children: any): ast.TypeDef {
    const name = children.Identifier[0].image;
    const fields: ast.TypeField[] = [];

    if (children.typeFieldList) {
      const fieldListNode = children.typeFieldList[0];
      if (fieldListNode.children && fieldListNode.children.typeField) {
        for (const field of fieldListNode.children.typeField) {
          const fieldType = this.getType(field.children.type[0].children);
          if (fieldType.wrapped) {
            throw new DSError(`Struct field cannot be a shared type — make the whole struct shared instead`);
          }
          const fieldName = field.children.Identifier[0].image;
          fields.push({ name: fieldName, fieldType });
        }
      }
    }

    return { type: 'TypeDef', name, fields };
  }

  visitConstDecl(children: any): ast.ConstDecl {
    const name = children.Identifier[0].image;
    const value = this.visitExpression(children.expression[0].children);
    return { type: 'ConstDecl', name, value };
  }

  visitSharedDecl(children: any): ast.SharedDecl {
    const name = children.Identifier[0].image;
    const value = this.visitExpression(children.expression[0].children);
    const varType = children.type?.length ? this.getType(children.type[0].children) : undefined;
    return { type: 'SharedDecl', name, value, varType };
  }

  visitWhileStatement(children: any): ast.WhileStatement {
    const condition = this.visitExpression(children.expression[0].children);
    const body: ast.Statement[] = [];

    if (children.block) {
      const blockNode = children.block[0];
      if (blockNode.children && blockNode.children.statement) {
        for (const stmt of blockNode.children.statement) {
          const result = this.visitStatement(stmt.children);
          if (result) {
            body.push(result);
          }
        }
      }
    }

    return { type: 'WhileStatement', condition, body };
  }

  visitIfStatement(children: any): ast.IfStatement {
    const condition = this.visitExpression(children.expression[0].children);
    const thenBranch: ast.Statement[] = [];

    if (children.block && children.block[0]) {
      const blockNode = children.block[0];
      if (blockNode.children && blockNode.children.statement) {
        for (const stmt of blockNode.children.statement) {
          const result = this.visitStatement(stmt.children);
          if (result) {
            thenBranch.push(result);
          }
        }
      }
    }

    const elifBranches: ast.ElifBranch[] = [];
    let elifIdx = 1;

    if (children.Elif) {
      const elifCount = children.Elif.length;
      for (let i = 0; i < elifCount; i++) {
        const elifCondition = this.visitExpression(children.expression[elifIdx].children);
        const elifBody: ast.Statement[] = [];

        if (children.block && children.block[elifIdx]) {
          const blockNode = children.block[elifIdx];
          if (blockNode.children && blockNode.children.statement) {
            for (const stmt of blockNode.children.statement) {
              const result = this.visitStatement(stmt.children);
              if (result) {
                elifBody.push(result);
              }
            }
          }
        }

        elifBranches.push({ condition: elifCondition, body: elifBody });
        elifIdx++;
      }
    }

    let elseBranch: ast.Statement[] | undefined;
    if (children.Else) {
      elseBranch = [];
      if (children.block && children.block[elifIdx]) {
        const blockNode = children.block[elifIdx];
        if (blockNode.children && blockNode.children.statement) {
          for (const stmt of blockNode.children.statement) {
            const result = this.visitStatement(stmt.children);
            if (result) {
              elseBranch.push(result);
            }
          }
        }
      }
    }

    return { type: 'IfStatement', condition, thenBranch, elifBranches, elseBranch };
  }

  visitBreakStatement(_children: any): ast.BreakStatement {
    return { type: 'BreakStatement' };
  }

  visitExpressionStatement(children: any): ast.ExpressionStatement {
    const expression = this.visitExpression(children.expression[0].children);
    return { type: 'ExpressionStatement', expression };
  }

  visitExpression(children: any): ast.Expression {
    return this.visitAssignmentExpr(children.assignmentExpr[0].children);
  }

  visitAssignmentExpr(children: any): ast.Expression {
    let expr = this.visitLogicalOrExpr(children.logicalOrExpr[0].children);

    // Handle assignments (target = value)
    if (children.Equals?.length) {
      if (expr.type !== 'Identifier' && expr.type !== 'IndexAccess') {
        throw new Error("Assignment target must be an identifier or index expression");
      }
      const target = expr as ast.Identifier | ast.IndexAccess;
      const value = this.visitLogicalOrExpr(children.logicalOrExpr[1].children);
      return { type: 'AssignmentExpr', target, value } as ast.AssignmentExpr;
    }

    return expr;
  }

  visitLogicalOrExpr(children: any): ast.Expression {
    let expr = this.visitLogicalAndExpr(children.logicalAndExpr[0].children);
    const count = (children.logicalAndExpr?.length ?? 1) - 1;
    for (let i = 0; i < count; i++) {
      const right = this.visitLogicalAndExpr(children.logicalAndExpr[i + 1].children);
      expr = { type: 'BinaryOp', left: expr, op: '||', right } as ast.BinaryOp;
    }
    return expr;
  }

  visitLogicalAndExpr(children: any): ast.Expression {
    let expr = this.visitComparisonExpr(children.comparisonExpr[0].children);
    const count = (children.comparisonExpr?.length ?? 1) - 1;
    for (let i = 0; i < count; i++) {
      const right = this.visitComparisonExpr(children.comparisonExpr[i + 1].children);
      expr = { type: 'BinaryOp', left: expr, op: '&&', right } as ast.BinaryOp;
    }
    return expr;
  }

  visitComparisonExpr(children: any): ast.Expression {
    // Collect all operators in source order
    type OpToken = { image: string; startOffset: number };
    const opTokens: OpToken[] = [
      ...(children.EqualEqual   || []).map((t: any) => ({ image: '==', startOffset: t.startOffset })),
      ...(children.NotEqual     || []).map((t: any) => ({ image: '!=', startOffset: t.startOffset })),
      ...(children.LessEqual    || []).map((t: any) => ({ image: '<=', startOffset: t.startOffset })),
      ...(children.GreaterEqual || []).map((t: any) => ({ image: '>=', startOffset: t.startOffset })),
      ...(children.Less         || []).map((t: any) => ({ image: '<',  startOffset: t.startOffset })),
      ...(children.Greater      || []).map((t: any) => ({ image: '>',  startOffset: t.startOffset })),
    ].sort((a, b) => a.startOffset - b.startOffset);

    let expr = this.visitAddExpr(children.addExpr[0].children);
    for (let i = 0; i < opTokens.length; i++) {
      const right = this.visitAddExpr(children.addExpr[i + 1].children);
      expr = { type: 'BinaryOp', left: expr, op: opTokens[i].image, right } as ast.BinaryOp;
    }
    return expr;
  }

  visitAddExpr(children: any): ast.Expression {
    type OpToken = { image: string; startOffset: number };
    const opTokens: OpToken[] = [
      ...(children.Plus  || []).map((t: any) => ({ image: '+', startOffset: t.startOffset })),
      ...(children.Minus || []).map((t: any) => ({ image: '-', startOffset: t.startOffset })),
    ].sort((a, b) => a.startOffset - b.startOffset);

    let expr = this.visitMulExpr(children.mulExpr[0].children);
    for (let i = 0; i < opTokens.length; i++) {
      const right = this.visitMulExpr(children.mulExpr[i + 1].children);
      expr = { type: 'BinaryOp', left: expr, op: opTokens[i].image, right } as ast.BinaryOp;
    }
    return expr;
  }

  visitMulExpr(children: any): ast.Expression {
    type OpToken = { image: string; startOffset: number };
    const opTokens: OpToken[] = [
      ...(children.Star  || []).map((t: any) => ({ image: '*', startOffset: t.startOffset })),
      ...(children.Slash || []).map((t: any) => ({ image: '/', startOffset: t.startOffset })),
    ].sort((a, b) => a.startOffset - b.startOffset);

    let expr = this.visitUnaryExpr(children.unaryExpr[0].children);
    for (let i = 0; i < opTokens.length; i++) {
      const right = this.visitUnaryExpr(children.unaryExpr[i + 1].children);
      expr = { type: 'BinaryOp', left: expr, op: opTokens[i].image, right } as ast.BinaryOp;
    }
    return expr;
  }

  visitUnaryExpr(children: any): ast.Expression {
    if (children.Spawn) {
      const expr = this.visitUnaryExpr(children.unaryExpr[0].children);
      return { type: 'SpawnExpr', expression: expr } as any;
    }
    if (children.Await) {
      const expr = this.visitUnaryExpr(children.unaryExpr[0].children);
      return { type: 'AwaitExpr', expression: expr } as any;
    }
    if (children.Bang) {
      const expr = this.visitUnaryExpr(children.unaryExpr[0].children);
      return { type: 'NotExpr', expression: expr } as ast.NotExpr;
    }
    return this.visitPostfixExpr(children.postfixExpr[0].children);
  }

  visitPostfixExpr(children: any): ast.Expression {
    let expr = this.visitPrimary(children.primary[0].children);

    // Track which identifiers/keywords have been consumed
    let dotCount = 0;
    let colonCount = 0;
    let parenCount = 0;
    let argListCount = 0;
    let typeArgIdx = 0;

    // Process Dot, Colon, and LParen in order
    const dotTokens = children.Dot || [];
    const colonTokens = children.Colon || [];
    const parenTokens = children.LParen || [];
    const typeArgLess = children.Less || [];    // one per method with type arg
    const typeArgTypes = children.type || [];   // one per method with type arg
    const identifiers = children.Identifier || [];
    const strings = children.String || [];
    const integers = children.Integer || [];
    const booleans = children.Boolean || [];
    const floats = children.Float || [];

    // Flatten all the identifier-like tokens
    const allNames = [
      ...identifiers.map((t: any) => ({ image: t.image, type: 'Identifier' })),
      ...strings.map((_t: any) => ({ image: 'String', type: 'String' })),
      ...integers.map((_t: any) => ({ image: 'Integer', type: 'Integer' })),
      ...booleans.map((_t: any) => ({ image: 'Boolean', type: 'Boolean' })),
      ...floats.map((_t: any) => ({ image: 'Float', type: 'Float' })),
    ];

    let nameIdx = 0;
    const bracketTokens = children.LBracket || [];
    const indexExprs = children.expression || [];
    let bracketCount = 0;
    let indexExprCount = 0;

    // Iterate through dots, colons, parens, and brackets
    for (let i = 0; i < dotTokens.length + colonTokens.length + parenTokens.length + bracketTokens.length; i++) {
      if (dotCount < dotTokens.length) {
        // Dot-based method/field access
        const methodName = allNames[nameIdx]?.image || 'unknown';
        nameIdx++;

        // Check if there's a following LParen
        if (parenCount < parenTokens.length && i + 1 < dotTokens.length + colonTokens.length + parenTokens.length) {
          const args: ast.Expression[] = [];
          if (argListCount < (children.argList?.length || 0)) {
            args.push(...this.visitArgList(children.argList[argListCount].children));
            argListCount++;
          }
          // Check if a type arg was consumed before this LParen
          let typeArg: import('../compiler/DTypes').DTypes.Type | undefined;
          const lessToken = typeArgLess[typeArgIdx];
          const parenToken = parenTokens[parenCount];
          if (lessToken && parenToken && lessToken.startOffset < parenToken.startOffset) {
            typeArg = this.getType(typeArgTypes[typeArgIdx].children);
            typeArgIdx++;
          }
          expr = { type: 'MethodCall', object: expr, method: methodName, args, typeArg } as ast.MethodCall;
          parenCount++;
          i++; // Skip the next LParen iteration
        } else {
          expr = { type: 'FieldAccess', object: expr, field: methodName } as ast.FieldAccess;
        }
        dotCount++;
      } else if (colonCount < colonTokens.length) {
        // Colon-based namespace method call
        const methodName = allNames[nameIdx]?.image || 'unknown';
        nameIdx++;

        const args: ast.Expression[] = [];
        if (parenCount < parenTokens.length && argListCount < (children.argList?.length || 0)) {
          args.push(...this.visitArgList(children.argList[argListCount].children));
          argListCount++;
          parenCount++;
          i++; // Skip the next LParen
        }
        expr = { type: 'MethodCall', object: expr, method: methodName, args } as ast.MethodCall;
        colonCount++;
      } else if (parenCount < parenTokens.length) {
        // Plain function call (on an identifier)
        const args: ast.Expression[] = [];
        if (argListCount < (children.argList?.length || 0)) {
          args.push(...this.visitArgList(children.argList[argListCount].children));
          argListCount++;
        }
        expr = { type: 'FunctionCall', name: (expr as ast.Identifier).name, args } as ast.FunctionCall;
        parenCount++;
      } else if (bracketCount < bracketTokens.length) {
        const index = this.visitExpression(indexExprs[indexExprCount].children);
        indexExprCount++;
        expr = { type: 'IndexAccess', object: expr, index } as ast.IndexAccess;
        bracketCount++;
      }
    }

    return expr;
  }

  visitArgList(children: any): ast.Expression[] {
    const args: ast.Expression[] = [];
    if (children.expression) {
      for (const exprNode of children.expression) {
        args.push(this.visitExpression(exprNode.children));
      }
    }
    return args;
  }

  visitPrimary(children: any): ast.Expression {
    if (children.Identifier) {
      return { type: 'Identifier', name: children.Identifier[0].image };
    }
    if (children.IntegerLiteral) {
      return { type: 'IntegerLiteral', value: parseInt(children.IntegerLiteral[0].image) };
    }
    if (children.FloatLiteral) {
      return { type: 'FloatLiteral', value: parseFloat(children.FloatLiteral[0].image) };
    }
    if (children.StringLiteral) {
      const str = children.StringLiteral[0].image;
      return { type: 'StringLiteral', value: str.slice(1, -1) };
    }
    if (children.True) {
      return { type: 'BooleanLiteral', value: true };
    }
    if (children.False) {
      return { type: 'BooleanLiteral', value: false };
    }
    if (children.None) {
      return { type: 'NoneExpr' };
    }
    if (children.cppBlock) {
      return this.visitCppBlock(children.cppBlock[0].children);
    }
    if (children.lambda) {
      return this.visitLambda(children.lambda[0].children);
    }
    if (children.listLiteral) {
      return this.visitListLiteral(children.listLiteral[0].children);
    }
    if (children.expression) {
      return this.visitExpression(children.expression[0].children);
    }

    return { type: 'Identifier', name: 'unknown' };
  }

  visitListLiteral(children: any): ast.ListLiteral {
    const elements: ast.Expression[] = (children.expression || []).map(
      (e: any) => this.visitExpression(e.children)
    );
    return { type: 'ListLiteral', elements };
  }

  visitCppBlock(children: any): ast.CppBlock {
    const code = children.StringLiteral[0].image.slice(1, -1);
    return { type: 'CppBlock', code };
  }

  visitLambda(children: any): ast.LambdaExpr {
    const params: ast.Param[] = [];

    if (children.paramList) {
      const paramListNode = children.paramList[0];
      if (paramListNode.children && paramListNode.children.param) {
        for (const p of paramListNode.children.param) {
          const paramName = p.children.Identifier[0].image;
          const paramType = p.children.type?.length ? this.getType(p.children.type[0].children) : undefined;
          params.push({ name: paramName, type: paramType });
        }
      }
    }

    const returnType = children.type?.length ? this.getType(children.type[0].children) : undefined;
    const body = this.visitExpression(children.expression[0].children);
    return { type: 'LambdaExpr', params, body, returnType };
  }

  getType(children: any): DTypes.Type {
    const isShared = (children.Dollar?.length > 0) || (children.Shared?.length > 0);

    let typeName = 'None';
    if (children.Identifier) typeName = children.Identifier[0].image;
    else if (children.String) typeName = 'String';
    else if (children.Integer) typeName = 'Integer';
    else if (children.Boolean) typeName = 'Boolean';
    else if (children.Float) typeName = 'Float';
    else if (children.None) typeName = 'None';

    let resolved: DTypes.Type;
    if (children.type?.length) {
      const innerType = this.getType(children.type[0].children);
      if (innerType.wrapped) {
        throw new DSError(`Shared type cannot be used as a sub-type, use $${typeName}<...> instead of ${typeName}<$...>`);
      }
      resolved = DTypes.resolveGeneric(typeName, innerType);
    } else {
      resolved = DTypes.resolve(typeName);
    }

    return isShared ? { ...resolved, wrapped: true } : resolved;
  }
}
