// AST Node Types
import { DTypes } from '../compiler/DTypes';

export type Node = Statement | Expression;

export interface Program {
  type: 'Program';
  statements: Statement[];
}

export type Statement =
  | FunctionDef
  | LetStatement
  | ConstDecl
  | ReturnStatement
  | IncludeStatement
  | CppStatement
  | TypeDef
  | SharedDecl
  | WhileStatement
  | IfStatement
  | BreakStatement
  | ExpressionStatement;

export interface FunctionDef {
  type: 'FunctionDef';
  name: string;
  params: Param[];
  returnType: DTypes.Type;
  body: Statement[];
}

export interface Param {
  name: string;
  type?: DTypes.Type;
}

export interface LetStatement {
  type: 'LetStatement';
  name: string;
  value: Expression;
  varType?: DTypes.Type;
}

export interface ConstDecl {
  type: 'ConstDecl';
  name: string;
  value: Expression;
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

export interface TypeDef {
  type: 'TypeDef';
  name: string;
  fields: TypeField[];
}

export interface TypeField {
  name: string;
  fieldType: DTypes.Type;
}

export interface SharedDecl {
  type: 'SharedDecl';
  name: string;
  value: Expression;
  varType?: DTypes.Type;
}

export interface WhileStatement {
  type: 'WhileStatement';
  condition: Expression;
  body: Statement[];
}

export interface IfStatement {
  type: 'IfStatement';
  condition: Expression;
  thenBranch: Statement[];
  elifBranches: ElifBranch[];
  elseBranch?: Statement[];
}

export interface ElifBranch {
  condition: Expression;
  body: Statement[];
}

export interface BreakStatement {
  type: 'BreakStatement';
}

export interface ExpressionStatement {
  type: 'ExpressionStatement';
  expression: Expression;
}

export type Expression =
  | Identifier
  | IntegerLiteral
  | StringLiteral
  | FloatLiteral
  | BooleanLiteral
  | MethodCall
  | FunctionCall
  | FieldAccess
  | CppBlock
  | LambdaExpr
  | BinaryOp
  | SpawnExpr
  | AwaitExpr
  | NotExpr
  | NoneExpr
  | AssignmentExpr
  | ListLiteral
  | IndexAccess;

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
  typeArg?: DTypes.Type;
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
  returnType?: DTypes.Type;
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

export interface NotExpr {
  type: 'NotExpr';
  expression: Expression;
}

export interface FieldAccess {
  type: 'FieldAccess';
  object: Expression;
  field: string;
}

export interface NoneExpr {
  type: 'NoneExpr';
}

export interface AssignmentExpr {
  type: 'AssignmentExpr';
  target: Identifier | IndexAccess;
  value: Expression;
}

export interface ListLiteral {
  type: 'ListLiteral';
  elements: Expression[];
}

export interface IndexAccess {
  type: 'IndexAccess';
  object: Expression;
  index: Expression;
}
