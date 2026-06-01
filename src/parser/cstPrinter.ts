import * as ast from './ast';

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
    let returnType = 'void';

    if (children.paramList) {
      const paramListNode = children.paramList[0];
      if (paramListNode.children && paramListNode.children.param) {
        for (const p of paramListNode.children.param) {
          const paramName = p.children.Identifier[0].image;
          const paramType = p.children.type ? this.getTypeString(p.children.type[0].children) : undefined;
          params.push({ name: paramName, type: paramType });
        }
      }
    }

    if (children.type) {
      returnType = this.getTypeString(children.type[0].children);
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
    return { type: 'LetStatement', name, value };
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
          const fieldType = this.getTypeString(field.children.type[0].children);
          const fieldName = field.children.Identifier[0].image;
          fields.push({ name: fieldName, fieldType });
        }
      }
    }

    return { type: 'TypeDef', name, fields };
  }

  visitSharedDecl(children: any): ast.SharedDecl {
    const varType = this.getTypeString(children.type[0].children);
    const name = children.Identifier[0].image;
    return { type: 'SharedDecl', varType, name };
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
    if (children.Equals) {
      if (expr.type !== 'Identifier') {
        throw new Error("Assignment target must be an identifier");
      }
      const target = (expr as ast.Identifier).name;
      const value = this.visitLogicalOrExpr(children.logicalOrExpr[1].children);
      return {
        type: 'AssignmentExpr',
        target,
        value
      } as ast.AssignmentExpr;
    }

    return expr;
  }

  visitLogicalOrExpr(children: any): ast.Expression {
    return this.visitComparisonExpr(children.comparisonExpr[0].children);
  }

  visitComparisonExpr(children: any): ast.Expression {
    let expr = this.visitAddExpr(children.addExpr[0].children);

    // Handle comparison operators (== and !=)
    if (children.EqualEqual || children.NotEqual) {
      let opIdx = 0;
      let exprIdx = 1;

      for (let i = 0; i < (children.EqualEqual?.length || 0) + (children.NotEqual?.length || 0); i++) {
        let op = '==';
        if (children.EqualEqual && opIdx < children.EqualEqual.length) {
          op = '==';
          opIdx++;
        } else if (children.NotEqual) {
          op = '!=';
          opIdx++;
        }

        const right = this.visitAddExpr(children.addExpr[exprIdx].children);
        expr = { type: 'BinaryOp', left: expr, op, right } as ast.BinaryOp;
        exprIdx++;
      }
    }

    return expr;
  }

  visitAddExpr(children: any): ast.Expression {
    let expr = this.visitMulExpr(children.mulExpr[0].children);
    return expr;
  }

  visitMulExpr(children: any): ast.Expression {
    let expr = this.visitUnaryExpr(children.unaryExpr[0].children);
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
    return this.visitPostfixExpr(children.postfixExpr[0].children);
  }

  visitPostfixExpr(children: any): ast.Expression {
    let expr = this.visitPrimary(children.primary[0].children);

    // Track which identifiers/keywords have been consumed
    let dotCount = 0;
    let colonCount = 0;
    let parenCount = 0;
    let identifierCount = 0;
    let argListCount = 0;

    // Process Dot, Colon, and LParen in order
    const dotTokens = children.Dot || [];
    const colonTokens = children.Colon || [];
    const parenTokens = children.LParen || [];
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

    // Iterate through dots, colons and parens
    for (let i = 0; i < dotTokens.length + colonTokens.length + parenTokens.length; i++) {
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
          expr = { type: 'MethodCall', object: expr, method: methodName, args } as ast.MethodCall;
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
    if (children.expression) {
      return this.visitExpression(children.expression[0].children);
    }

    return { type: 'Identifier', name: 'unknown' };
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
          params.push({ name: paramName });
        }
      }
    }

    const body = this.visitExpression(children.expression[0].children);
    return { type: 'LambdaExpr', params, body };
  }

  getTypeString(children: any): string {
    if (children.Identifier) return children.Identifier[0].image;
    if (children.String) return 'String';
    if (children.Integer) return 'Integer';
    if (children.Boolean) return 'Boolean';
    if (children.Float) return 'Float';
    if (children.None) return 'None';
    return 'unknown';
  }
}
