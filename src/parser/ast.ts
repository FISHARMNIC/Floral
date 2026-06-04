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
  line?: number;
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
  line?: number;
}

export interface ConstDecl {
  type: 'ConstDecl';
  name: string;
  value: Expression;
  line?: number;
}

export interface ReturnStatement {
  type: 'ReturnStatement';
  expression: Expression;
  line?: number;
}

export interface IncludeStatement {
  type: 'IncludeStatement';
  includes: string[];
  line?: number;
}

export interface CppStatement {
  type: 'CppStatement';
  code: string;
  line?: number;
}

export interface TypeDef {
  type: 'TypeDef';
  name: string;
  fields: TypeField[];
  line?: number;
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
  line?: number;
}

export interface WhileStatement {
  type: 'WhileStatement';
  condition: Expression;
  body: Statement[];
  line?: number;
}

export interface IfStatement {
  type: 'IfStatement';
  condition: Expression;
  thenBranch: Statement[];
  elifBranches: ElifBranch[];
  elseBranch?: Statement[];
  line?: number;
}

export interface ElifBranch {
  condition: Expression;
  body: Statement[];
}

export interface BreakStatement {
  type: 'BreakStatement';
  line?: number;
}

export interface ExpressionStatement {
  type: 'ExpressionStatement';
  expression: Expression;
  line?: number;
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
  line?: number;
}

export interface IntegerLiteral {
  type: 'IntegerLiteral';
  value: number;
  line?: number;
}

export interface StringLiteral {
  type: 'StringLiteral';
  value: string;
  line?: number;
}

export interface FloatLiteral {
  type: 'FloatLiteral';
  value: number;
  line?: number;
}

export interface BooleanLiteral {
  type: 'BooleanLiteral';
  value: boolean;
  line?: number;
}

export interface MethodCall {
  type: 'MethodCall';
  object: Expression;
  method: string;
  args: Expression[];
  line?: number;
}

export interface FunctionCall {
  type: 'FunctionCall';
  name: string;
  args: Expression[];
  line?: number;
}

export interface CppBlock {
  type: 'CppBlock';
  code: string;
  line?: number;
}

export interface LambdaExpr {
  type: 'LambdaExpr';
  params: Param[];
  body: Expression;
  returnType?: DTypes.Type;
  line?: number;
}

export interface BinaryOp {
  type: 'BinaryOp';
  left: Expression;
  op: string;
  right: Expression;
  line?: number;
}

export interface SpawnExpr {
  type: 'SpawnExpr';
  expression: Expression;
  line?: number;
}

export interface AwaitExpr {
  type: 'AwaitExpr';
  expression: Expression;
  line?: number;
}

export interface NotExpr {
  type: 'NotExpr';
  expression: Expression;
  line?: number;
}

export interface FieldAccess {
  type: 'FieldAccess';
  object: Expression;
  field: string;
  line?: number;
}

export interface NoneExpr {
  type: 'NoneExpr';
  line?: number;
}

export interface AssignmentExpr {
  type: 'AssignmentExpr';
  target: Identifier | IndexAccess;
  value: Expression;
  line?: number;
}

export interface ListLiteral {
  type: 'ListLiteral';
  elements: Expression[];
  line?: number;
}

export interface IndexAccess {
  type: 'IndexAccess';
  object: Expression;
  index: Expression;
  line?: number;
}
