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
    if (children.functionDef) return this.visitFunctionDef(children.functionDef[0].children);
    if (children.cppStatement) return this.visitCppStatement(children.cppStatement[0].children);
    if (children.letStatement) return this.visitLetStatement(children.letStatement[0].children);
    if (children.printStatement) return this.visitPrintStatement(children.printStatement[0].children);
    if (children.messageStatement) return this.visitMessageStatement(children.messageStatement[0].children);
    if (children.returnStatement) return this.visitReturnStatement(children.returnStatement[0].children);

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

  visitPrintStatement(children: any): ast.PrintStatement {
    const expression = this.visitExpression(children.expression[0].children);
    return { type: 'PrintStatement', expression };
  }

  visitMessageStatement(children: any): ast.MessageStatement {
    const message = children.StringLiteral[0].image.slice(1, -1);
    return { type: 'MessageStatement', message };
  }

  visitReturnStatement(children: any): ast.ReturnStatement {
    const expression = this.visitExpression(children.expression[0].children);
    return { type: 'ReturnStatement', expression };
  }

  visitCppStatement(children: any): ast.CppStatement {
    const code = children.StringLiteral[0].image.slice(1, -1);
    return { type: 'CppStatement', code };
  }

  visitExpression(children: any): ast.Expression {
    return this.visitAssignmentExpr(children.assignmentExpr[0].children);
  }

  visitAssignmentExpr(children: any): ast.Expression {
    let expr = this.visitLogicalOrExpr(children.logicalOrExpr[0].children);
    return expr;
  }

  visitLogicalOrExpr(children: any): ast.Expression {
    return this.visitAddExpr(children.addExpr[0].children);
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

    // Handle method calls and function calls
    if (children.Dot) {
      // Get all the tokens that came after the Dot tokens
      // These could be Identifier or keyword tokens (String, Integer, Boolean, Float)
      let identifierIdx = 0;
      let keywordIdx = 0;

      for (let i = 0; i < children.Dot.length; i++) {
        let methodName = '';

        // Try to get the next identifier or keyword
        if (children.Identifier && identifierIdx < children.Identifier.length) {
          methodName = children.Identifier[identifierIdx].image;
          identifierIdx++;
        } else if (children.String && keywordIdx < children.String.length) {
          methodName = 'String';
          keywordIdx++;
        } else if (children.Integer && keywordIdx < children.Integer.length) {
          methodName = 'Integer';
          keywordIdx++;
        } else if (children.Boolean && keywordIdx < children.Boolean.length) {
          methodName = 'Boolean';
          keywordIdx++;
        } else if (children.Float && keywordIdx < children.Float.length) {
          methodName = 'Float';
          keywordIdx++;
        }

        // Find the corresponding argList and LParen
        const hasCall = children.LParen && i < children.LParen.length;
        if (hasCall) {
          const args: ast.Expression[] = [];
          if (children.argList && children.argList[i]) {
            args.push(...this.visitArgList(children.argList[i].children));
          }
          expr = { type: 'MethodCall', object: expr, method: methodName, args } as ast.MethodCall;
        } else {
          expr = { type: 'MethodCall', object: expr, method: methodName, args: [] } as ast.MethodCall;
        }
      }
    } else if (children.LParen) {
      // Function calls without method
      for (let i = 0; i < children.LParen.length; i++) {
        const args: ast.Expression[] = [];
        if (children.argList && children.argList[i]) {
          args.push(...this.visitArgList(children.argList[i].children));
        }
        expr = { type: 'FunctionCall', name: (expr as ast.Identifier).name, args } as ast.FunctionCall;
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
    return 'unknown';
  }
}
