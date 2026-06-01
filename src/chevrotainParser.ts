import { CstParser } from 'chevrotain';
import {
  Let, Function, Return, Message, Print, If, Else, True, False, String, Integer, Boolean, Float,
  Spawn, Await, Lam, Include, Cpp, LParen, RParen, LBrace, RBrace, LBracket, RBracket, Dot,
  Comma, Colon, Semicolon, Arrow, Equals, Plus, Minus, Star, Slash, StringLiteral, IntegerLiteral,
  FloatLiteral, Identifier, allTokens
} from './lexer';

export class DaisyLangParser extends CstParser {
  constructor() {
    super(allTokens, {
      recoveryEnabled: true,
    });
    this.performSelfAnalysis();
  }

  program = this.RULE('program', () => {
    this.MANY(() => this.SUBRULE(this.statement));
  });

  statement = this.RULE('statement', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.includeStat) },
      { ALT: () => this.SUBRULE(this.functionDef) },
      { ALT: () => this.SUBRULE(this.cppStatement) },
      { ALT: () => this.SUBRULE(this.letStatement) },
      { ALT: () => this.SUBRULE(this.printStatement) },
      { ALT: () => this.SUBRULE(this.messageStatement) },
      { ALT: () => this.SUBRULE(this.returnStatement) },
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
    this.CONSUME(Function);
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
  });

  letStatement = this.RULE('letStatement', () => {
    this.CONSUME(Let);
    this.CONSUME(Identifier);
    this.CONSUME(Equals);
    this.SUBRULE(this.expression);
  });

  printStatement = this.RULE('printStatement', () => {
    this.CONSUME(Print);
    this.CONSUME(LParen);
    this.SUBRULE(this.expression);
    this.CONSUME(RParen);
  });

  messageStatement = this.RULE('messageStatement', () => {
    this.CONSUME(Message);
    this.CONSUME(StringLiteral);
  });

  returnStatement = this.RULE('returnStatement', () => {
    this.CONSUME(Return);
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
    this.SUBRULE(this.addExpr);
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
      { ALT: () => this.SUBRULE(this.postfixExpr) },
    ]);
  });

  postfixExpr = this.RULE('postfixExpr', () => {
    this.SUBRULE(this.primary);
    this.MANY(() => {
      this.OR([
        { ALT: () => {
          this.CONSUME(Dot);
          // Method name can be identifier or keyword
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
          this.CONSUME2(LParen);
          this.OPTION3(() => this.SUBRULE2(this.argList));
          this.CONSUME2(RParen);
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

  primary = this.RULE('primary', () => {
    this.OR([
      { ALT: () => this.CONSUME(Identifier) },
      { ALT: () => this.CONSUME(IntegerLiteral) },
      { ALT: () => this.CONSUME(FloatLiteral) },
      { ALT: () => this.CONSUME(StringLiteral) },
      { ALT: () => this.CONSUME(True) },
      { ALT: () => this.CONSUME(False) },
      { ALT: () => this.SUBRULE(this.cppBlock) },
      { ALT: () => this.SUBRULE(this.lambda) },
      { ALT: () => {
        this.CONSUME(LParen);
        this.SUBRULE(this.expression);
        this.CONSUME(RParen);
      }},
    ]);
  });

  cppBlock = this.RULE('cppBlock', () => {
    this.CONSUME(Cpp);
    this.CONSUME(LParen);
    this.CONSUME(StringLiteral);
    this.CONSUME(RParen);
  });

  lambda = this.RULE('lambda', () => {
    this.CONSUME(Lam);
    this.CONSUME(LParen);
    this.OPTION(() => this.SUBRULE(this.paramList));
    this.CONSUME(RParen);
    this.CONSUME(Colon);
    this.SUBRULE(this.expression);
  });

  type = this.RULE('type', () => {
    this.OR([
      { ALT: () => this.CONSUME(String) },
      { ALT: () => this.CONSUME(Integer) },
      { ALT: () => this.CONSUME(Boolean) },
      { ALT: () => this.CONSUME(Float) },
      { ALT: () => this.CONSUME(Identifier) }, // Custom types
    ]);
  });
}

export const parser = new DaisyLangParser();
