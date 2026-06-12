import { CstParser } from 'chevrotain';
import {
  Let, Function, Def, Return, If, Else, Elif, True, False, String, Integer, Boolean, Float,
  Spawn, Await, Lam, Include, Cpp, LParen, RParen, LBrace, RBrace, LBracket, RBracket, Dot,
  Comma, Colon, Semicolon, Arrow, Equals, EqualEqual, NotEqual, Less, Greater, LessEqual, GreaterEqual, Plus, Minus, Star, Slash, Dollar, Bang, Const, AndAnd, OrOr, Lambda, Int,
  StringLiteral, IntegerLiteral, FloatLiteral, Identifier, While, Break, Shared, Type, None, Indent, Dedent, Newline, End, Import, Export, As, allTokens
} from './lexer';

export class DaisyLangParser extends CstParser {
  constructor() {
    super(allTokens);
    this.performSelfAnalysis();
  }

  program = this.RULE('program', () => {
    this.MANY(() => this.SUBRULE(this.statement));
  });

  statement = this.RULE('statement', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.importStatement) },
      { ALT: () => this.SUBRULE(this.exportDeclaration) },
      { ALT: () => this.SUBRULE(this.includeStat) },
      { ALT: () => this.SUBRULE(this.typeDef) },
      { ALT: () => this.SUBRULE(this.sharedDecl) },
      { ALT: () => this.SUBRULE(this.constDecl) },
      { ALT: () => this.SUBRULE(this.functionDef) },
      { ALT: () => this.SUBRULE(this.whileStatement) },
      { ALT: () => this.SUBRULE(this.ifStatement) },
      { ALT: () => this.SUBRULE(this.letStatement) },
      { ALT: () => this.SUBRULE(this.returnStatement) },
      { ALT: () => this.SUBRULE(this.breakStatement) },
      { ALT: () => this.SUBRULE(this.expressionStatement) },
    ]);
    this.OPTION(() => this.CONSUME(Semicolon));
  });

  importStatement = this.RULE('importStatement', () => {
    this.CONSUME(Import);
    this.CONSUME(StringLiteral);
    this.CONSUME(As);
    this.CONSUME(Identifier);
  });

  exportDeclaration = this.RULE('exportDeclaration', () => {
    this.CONSUME(Export);
    this.OR([
      { ALT: () => this.SUBRULE(this.functionDef) },
      { ALT: () => this.SUBRULE(this.letStatement) },
      { ALT: () => this.SUBRULE(this.constDecl) },
      { ALT: () => this.SUBRULE(this.sharedDecl) },
      { ALT: () => this.SUBRULE(this.typeDef) },
    ]);
  });

  cppStatement = this.RULE('cppStatement', () => {
    this.CONSUME(Cpp);
    this.CONSUME(LParen);
    this.CONSUME(StringLiteral);
    this.CONSUME(RParen);
  });

  includeStat = this.RULE('includeStat', () => {
    this.CONSUME(Include);
    this.CONSUME(LParen);
    this.CONSUME(StringLiteral);
    this.MANY(() => {
      this.CONSUME(Comma);
      this.CONSUME2(StringLiteral);
    });
    this.CONSUME(RParen);
  });

  functionDef = this.RULE('functionDef', () => {
    this.OR([
      { ALT: () => this.CONSUME(Function) },
      { ALT: () => this.CONSUME(Def) },
    ]);
    this.CONSUME(Identifier);
    this.OPTION(() => {
      this.CONSUME(LParen);
      this.OPTION2(() => this.SUBRULE(this.paramList));
      this.CONSUME(RParen);
    });
    this.OPTION3(() => {
      this.CONSUME(Arrow);
      this.SUBRULE(this.type);
    });
    this.CONSUME(Colon);
    this.SUBRULE(this.block);
  });

  paramList = this.RULE('paramList', () => {
    this.SUBRULE(this.param);
    this.MANY(() => {
      this.CONSUME(Comma);
      this.SUBRULE2(this.param);
    });
  });

  param = this.RULE('param', () => {
    this.OR([
      { ALT: () => {
        this.SUBRULE(this.type);
        this.CONSUME(Identifier);
      }},
      { ALT: () => this.CONSUME2(Identifier) },
    ]);
  });

  block = this.RULE('block', () => {
    this.MANY(() => this.SUBRULE(this.statement));
    this.OPTION(() => this.CONSUME(End));
  });

  letStatement = this.RULE('letStatement', () => {
    this.CONSUME(Let);
    this.OR([
      // Type-before-name: let List<Integer> a = ...  or  let Integer a = ...
      {
        GATE: () => {
          const t1 = this.LA(1);
          const t2 = this.LA(2);
          return t1.tokenType === Dollar ||
            t1.tokenType === Integer || t1.tokenType === Int || t1.tokenType === String ||
            t1.tokenType === Float || t1.tokenType === Boolean || t1.tokenType === None ||
            (t1.tokenType === Identifier && t2.tokenType !== Equals && t2.tokenType !== Colon);
        },
        ALT: () => {
          this.SUBRULE(this.type);
          this.CONSUME(Identifier);
        }
      },
      // Name-first: let a = ...  or  let a: Integer = ...
      {
        ALT: () => {
          this.CONSUME2(Identifier);
          this.OPTION(() => {
            this.CONSUME(Colon);
            this.SUBRULE2(this.type);
          });
        }
      }
    ]);
    this.OPTION2(() => {
      this.CONSUME(Equals);
      this.SUBRULE(this.expression);
    });
  });

  returnStatement = this.RULE('returnStatement', () => {
    this.CONSUME(Return);
    this.SUBRULE(this.expression);
  });

  typeDef = this.RULE('typeDef', () => {
    this.CONSUME(Type);
    this.CONSUME(Identifier);
    this.CONSUME(Equals);
    this.CONSUME(LBrace);
    this.SUBRULE(this.typeFieldList);
    this.CONSUME(RBrace);
  });

  typeFieldList = this.RULE('typeFieldList', () => {
    this.SUBRULE(this.typeField);
    this.MANY(() => {
      this.CONSUME(Comma);
      this.SUBRULE2(this.typeField);
    });
  });

  typeField = this.RULE('typeField', () => {
    this.SUBRULE(this.type);
    this.CONSUME(Identifier);
  });

  sharedDecl = this.RULE('sharedDecl', () => {
    this.CONSUME(Shared);
    this.OR([
      // Type-before-name: shared List<Integer> b = ...
      {
        GATE: () => {
          const t1 = this.LA(1);
          const t2 = this.LA(2);
          return t1.tokenType === Dollar ||
            t1.tokenType === Integer || t1.tokenType === Int || t1.tokenType === String ||
            t1.tokenType === Float || t1.tokenType === Boolean || t1.tokenType === None ||
            (t1.tokenType === Identifier && t2.tokenType !== Equals);
        },
        ALT: () => {
          this.SUBRULE(this.type);
          this.CONSUME(Identifier);
        }
      },
      // Name only: shared b = ...
      {
        ALT: () => {
          this.CONSUME2(Identifier);
        }
      }
    ]);
    this.OPTION2(() => {
      this.CONSUME(Equals);
      this.SUBRULE(this.expression);
    });
  });

  constDecl = this.RULE('constDecl', () => {
    this.CONSUME(Const);
    this.CONSUME(Identifier);
    this.CONSUME(Equals);
    this.SUBRULE(this.expression);
  });

  whileStatement = this.RULE('whileStatement', () => {
    this.CONSUME(While);
    this.CONSUME(LParen);
    this.SUBRULE(this.expression);
    this.CONSUME(RParen);
    this.CONSUME(Colon);
    this.SUBRULE(this.block);
  });

  ifStatement = this.RULE('ifStatement', () => {
    this.CONSUME(If);
    this.CONSUME(LParen);
    this.SUBRULE(this.expression);
    this.CONSUME(RParen);
    this.CONSUME(Colon);
    this.SUBRULE(this.block);
    this.MANY(() => {
      this.CONSUME(Elif);
      this.CONSUME2(LParen);
      this.SUBRULE2(this.expression);
      this.CONSUME2(RParen);
      this.CONSUME2(Colon);
      this.SUBRULE2(this.block);
    });
    this.OPTION(() => {
      this.CONSUME(Else);
      this.CONSUME3(Colon);
      this.SUBRULE3(this.block);
    });
  });

  breakStatement = this.RULE('breakStatement', () => {
    this.CONSUME(Break);
  });

  expressionStatement = this.RULE('expressionStatement', () => {
    this.SUBRULE(this.expression);
  });

  expression = this.RULE('expression', () => {
    this.SUBRULE(this.assignmentExpr);
  });

  assignmentExpr = this.RULE('assignmentExpr', () => {
    this.SUBRULE(this.logicalOrExpr);
    this.MANY(() => {
      this.CONSUME(Equals);
      this.SUBRULE2(this.logicalOrExpr);
    });
  });

  logicalOrExpr = this.RULE('logicalOrExpr', () => {
    this.SUBRULE(this.logicalAndExpr);
    this.MANY(() => {
      this.CONSUME(OrOr);
      this.SUBRULE2(this.logicalAndExpr);
    });
  });

  logicalAndExpr = this.RULE('logicalAndExpr', () => {
    this.SUBRULE(this.comparisonExpr);
    this.MANY(() => {
      this.CONSUME(AndAnd);
      this.SUBRULE2(this.comparisonExpr);
    });
  });

  comparisonExpr = this.RULE('comparisonExpr', () => {
    this.SUBRULE(this.addExpr);
    this.MANY(() => {
      this.OR([
        { ALT: () => this.CONSUME(EqualEqual) },
        { ALT: () => this.CONSUME(NotEqual) },
        { ALT: () => this.CONSUME(LessEqual) },
        { ALT: () => this.CONSUME(GreaterEqual) },
        { ALT: () => this.CONSUME(Less) },
        { ALT: () => this.CONSUME(Greater) },
      ]);
      this.SUBRULE2(this.addExpr);
    });
  });

  addExpr = this.RULE('addExpr', () => {
    this.SUBRULE(this.mulExpr);
    this.MANY(() => {
      this.OR([
        { ALT: () => this.CONSUME(Plus) },
        { ALT: () => this.CONSUME(Minus) },
      ]);
      this.SUBRULE2(this.mulExpr);
    });
  });

  mulExpr = this.RULE('mulExpr', () => {
    this.SUBRULE(this.unaryExpr);
    this.MANY(() => {
      this.OR([
        { ALT: () => this.CONSUME(Star) },
        { ALT: () => this.CONSUME(Slash) },
      ]);
      this.SUBRULE2(this.unaryExpr);
    });
  });

  unaryExpr = this.RULE('unaryExpr', () => {
    this.OR([
      { ALT: () => {
        this.CONSUME(Spawn);
        this.SUBRULE(this.unaryExpr);
      }},
      { ALT: () => {
        this.CONSUME(Await);
        this.SUBRULE2(this.unaryExpr);
      }},
      { ALT: () => {
        this.CONSUME(Bang);
        this.SUBRULE3(this.unaryExpr);
      }},
      { ALT: () => this.SUBRULE(this.postfixExpr) },
    ]);
  });

  postfixExpr = this.RULE('postfixExpr', () => {
    this.SUBRULE(this.primary);
    this.MANY(() => {
      this.OR([
        { ALT: () => {
          this.CONSUME(Dot);
          // Field/method name can be identifier or keyword
          this.OR2([
            { ALT: () => this.CONSUME(Identifier) },
            { ALT: () => this.CONSUME(String) },
            { ALT: () => this.CONSUME(Integer) },
            { ALT: () => this.CONSUME(Boolean) },
            { ALT: () => this.CONSUME(Float) },
          ]);
          this.OPTION(() => {
            this.CONSUME(LParen);
            this.OPTION2(() => this.SUBRULE(this.argList));
            this.CONSUME(RParen);
          });
        }},
        { ALT: () => {
          this.CONSUME(Colon);
          // Method call with colon (namespace method): obj:method(args)
          this.OR3([
            { ALT: () => this.CONSUME2(Identifier) },
            { ALT: () => this.CONSUME2(String) },
            { ALT: () => this.CONSUME2(Integer) },
            { ALT: () => this.CONSUME2(Boolean) },
            { ALT: () => this.CONSUME2(Float) },
          ]);
          this.OPTION3(() => {
            this.CONSUME2(LParen);
            this.OPTION4(() => this.SUBRULE2(this.argList));
            this.CONSUME2(RParen);
          });
        }},
        { ALT: () => {
          this.CONSUME3(LParen);
          this.OPTION5(() => this.SUBRULE3(this.argList));
          this.CONSUME3(RParen);
        }},
        { ALT: () => {
          this.CONSUME(LBracket);
          this.SUBRULE(this.expression);
          this.CONSUME(RBracket);
        }},
      ]);
    });
  });

  argList = this.RULE('argList', () => {
    this.SUBRULE(this.expression);
    this.MANY(() => {
      this.CONSUME(Comma);
      this.SUBRULE2(this.expression);
    });
  });

  structLiteral = this.RULE('structLiteral', () => {
    this.CONSUME(Identifier);
    this.CONSUME(LBrace);
    this.OPTION(() => {
      this.SUBRULE(this.structField);
      this.MANY(() => {
        this.CONSUME(Comma);
        this.SUBRULE2(this.structField);
      });
    });
    this.CONSUME(RBrace);
  });

  structField = this.RULE('structField', () => {
    this.CONSUME(Identifier);
    this.CONSUME(Colon);
    this.SUBRULE(this.expression);
  });

  primary = this.RULE('primary', () => {
    this.OR([
      {
        GATE: () => this.LA(1).tokenType === Identifier && this.LA(2).tokenType === LBrace,
        ALT: () => this.SUBRULE(this.structLiteral),
      },
      { ALT: () => this.CONSUME(Identifier) },
      { ALT: () => this.CONSUME(IntegerLiteral) },
      { ALT: () => this.CONSUME(FloatLiteral) },
      { ALT: () => this.CONSUME(StringLiteral) },
      { ALT: () => this.CONSUME(True) },
      { ALT: () => this.CONSUME(False) },
      { ALT: () => this.CONSUME(None) },
      { ALT: () => this.SUBRULE(this.cppBlock) },
      { ALT: () => this.SUBRULE(this.lambda) },
      { ALT: () => this.SUBRULE(this.listLiteral) },
      { ALT: () => {
        this.CONSUME(LParen);
        this.SUBRULE(this.expression);
        this.CONSUME(RParen);
      }},
    ]);
  });

  listLiteral = this.RULE('listLiteral', () => {
    this.CONSUME(LBracket);
    this.OPTION(() => {
      this.SUBRULE(this.expression);
      this.MANY(() => {
        this.CONSUME(Comma);
        this.SUBRULE2(this.expression);
      });
    });
    this.CONSUME(RBracket);
  });

  cppBlock = this.RULE('cppBlock', () => {
    this.CONSUME(Cpp);
    this.CONSUME(LParen);
    this.CONSUME(StringLiteral);
    this.CONSUME(RParen);
  });

  lambda = this.RULE('lambda', () => {
    this.OR4([
      { ALT: () => this.CONSUME(Lam) },
      { ALT: () => this.CONSUME(Lambda) },
    ]);
    this.CONSUME(LParen);
    this.OPTION(() => this.SUBRULE(this.paramList));
    this.CONSUME(RParen);
    this.OPTION2(() => {
      this.CONSUME(Arrow);
      this.SUBRULE(this.type);
    });
    this.CONSUME(Colon);
    this.SUBRULE(this.expression);
  });

  type = this.RULE('type', () => {
    this.OPTION(() => this.OR2([
      { ALT: () => this.CONSUME(Dollar) },
      { ALT: () => this.CONSUME(Shared) },
    ]));
    this.OR([
      { ALT: () => this.CONSUME(String) },
      { ALT: () => this.CONSUME(Integer) },
      { ALT: () => this.CONSUME(Int) },
      { ALT: () => this.CONSUME(Boolean) },
      { ALT: () => this.CONSUME(Float) },
      { ALT: () => this.CONSUME(None) },
      { ALT: () => this.CONSUME(Identifier) }, // Custom types
    ]);
    // Optional generic parameter(s) e.g. List<Integer>, Function<None, Integer, String>
    this.OPTION2(() => {
      this.CONSUME(Less);
      this.SUBRULE(this.type);
      this.MANY(() => {
        this.CONSUME(Comma);
        this.SUBRULE2(this.type);
      });
      this.CONSUME(Greater);
    });
  });
}

export const parser = new DaisyLangParser();
// Re-export for testing
export { Indent, Dedent };
