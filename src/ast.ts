// AST Node Types

export type Node = Statement | Expression;

export interface Program {
  type: 'Program';
  statements: Statement[];
}

export type Statement =
  | FunctionDef
  | LetStatement
  | MessageStatement
  | PrintStatement
  | ReturnStatement
  | IncludeStatement
  | CppStatement;

export interface FunctionDef {
  type: 'FunctionDef';
  name: string;
  params: Param[];
  returnType: string;
  body: Statement[];
}

export interface Param {
  name: string;
  type?: string;
}

export interface LetStatement {
  type: 'LetStatement';
  name: string;
  value: Expression;
}

export interface MessageStatement {
  type: 'MessageStatement';
  message: string;
}

export interface PrintStatement {
  type: 'PrintStatement';
  expression: Expression;
}

export interface ReturnStatement {
  type: 'ReturnStatement';
  expression: Expression;
}

export interface IncludeStatement {
  type: 'IncludeStatement';
  includes: string[];
}

export interface CppStatement {
  type: 'CppStatement';
  code: string;
}

export type Expression =
  | Identifier
  | IntegerLiteral
  | StringLiteral
  | FloatLiteral
  | BooleanLiteral
  | MethodCall
  | FunctionCall
  | CppBlock
  | LambdaExpr
  | BinaryOp
  | SpawnExpr
  | AwaitExpr;

export interface Identifier {
  type: 'Identifier';
  name: string;
}

export interface IntegerLiteral {
  type: 'IntegerLiteral';
  value: number;
}

export interface StringLiteral {
  type: 'StringLiteral';
  value: string;
}

export interface FloatLiteral {
  type: 'FloatLiteral';
  value: number;
}

export interface BooleanLiteral {
  type: 'BooleanLiteral';
  value: boolean;
}

export interface MethodCall {
  type: 'MethodCall';
  object: Expression;
  method: string;
  args: Expression[];
}

export interface FunctionCall {
  type: 'FunctionCall';
  name: string;
  args: Expression[];
}

export interface CppBlock {
  type: 'CppBlock';
  code: string;
}

export interface LambdaExpr {
  type: 'LambdaExpr';
  params: Param[];
  body: Expression;
}

export interface BinaryOp {
  type: 'BinaryOp';
  left: Expression;
  op: string;
  right: Expression;
}

export interface SpawnExpr {
  type: 'SpawnExpr';
  expression: Expression;
}

export interface AwaitExpr {
  type: 'AwaitExpr';
  expression: Expression;
}
