import { createToken, Lexer } from 'chevrotain';

// Keywords
export const Let = createToken({ name: 'Let', pattern: /let/ });
export const Function = createToken({ name: 'Function', pattern: /function/ });
export const Return = createToken({ name: 'Return', pattern: /return/ });
export const Message = createToken({ name: 'Message', pattern: /message/ });
export const Print = createToken({ name: 'Print', pattern: /print/ });
export const If = createToken({ name: 'If', pattern: /if/ });
export const Else = createToken({ name: 'Else', pattern: /else/ });
export const True = createToken({ name: 'True', pattern: /true/ });
export const False = createToken({ name: 'False', pattern: /false/ });
export const String = createToken({ name: 'String', pattern: /String/ });
export const Integer = createToken({ name: 'Integer', pattern: /Integer/ });
export const Boolean = createToken({ name: 'Boolean', pattern: /Boolean/ });
export const Float = createToken({ name: 'Float', pattern: /Float/ });
export const Spawn = createToken({ name: 'Spawn', pattern: /spawn/ });
export const Await = createToken({ name: 'Await', pattern: /await/ });
export const Lam = createToken({ name: 'Lam', pattern: /lam/ });
export const Include = createToken({ name: 'Include', pattern: /#INCLUDE/ });
export const Cpp = createToken({ name: 'Cpp', pattern: /#CPP/ });

// Operators and punctuation
export const LParen = createToken({ name: 'LParen', pattern: /\(/ });
export const RParen = createToken({ name: 'RParen', pattern: /\)/ });
export const LBrace = createToken({ name: 'LBrace', pattern: /{/ });
export const RBrace = createToken({ name: 'RBrace', pattern: /}/ });
export const LBracket = createToken({ name: 'LBracket', pattern: /\[/ });
export const RBracket = createToken({ name: 'RBracket', pattern: /\]/ });
export const Dot = createToken({ name: 'Dot', pattern: /\./ });
export const Comma = createToken({ name: 'Comma', pattern: /,/ });
export const Colon = createToken({ name: 'Colon', pattern: /:/ });
export const Semicolon = createToken({ name: 'Semicolon', pattern: /;/ });
export const Arrow = createToken({ name: 'Arrow', pattern: /->/ });
export const Equals = createToken({ name: 'Equals', pattern: /=/ });
export const Plus = createToken({ name: 'Plus', pattern: /\+/ });
export const Minus = createToken({ name: 'Minus', pattern: /-/ });
export const Star = createToken({ name: 'Star', pattern: /\*/ });
export const Slash = createToken({ name: 'Slash', pattern: /\// });

// Literals - order matters! C++ block and strings must be before CPP keyword
export const StringLiteral = createToken({
  name: 'StringLiteral',
  pattern: /"(?:\\.|[^"\\])*"/,
});

export const IntegerLiteral = createToken({ name: 'IntegerLiteral', pattern: /[0-9]+/ });
export const FloatLiteral = createToken({ name: 'FloatLiteral', pattern: /[0-9]+\.[0-9]+/ });
export const Identifier = createToken({ name: 'Identifier', pattern: /[a-zA-Z_][a-zA-Z0-9_]*/ });

// Whitespace (including tabs and newlines)
export const WhiteSpace = createToken({
  name: 'WhiteSpace',
  pattern: /\s+/,
  group: Lexer.SKIPPED,
});

// Comments
export const Comment = createToken({
  name: 'Comment',
  pattern: /\/\/[^\n]*/,
  group: Lexer.SKIPPED,
});

export const allTokens = [
  Comment,
  WhiteSpace,
  Include,
  Cpp,
  Function,
  Let,
  Return,
  Message,
  Print,
  If,
  Else,
  Spawn,
  Await,
  Lam,
  Arrow,
  String,
  Integer,
  Boolean,
  Float,
  True,
  False,
  LParen,
  RParen,
  LBrace,
  RBrace,
  LBracket,
  RBracket,
  Dot,
  Comma,
  Colon,
  Semicolon,
  Equals,
  Plus,
  Minus,
  Star,
  Slash,
  FloatLiteral,
  IntegerLiteral,
  StringLiteral,
  Identifier,
];

export const daisyLangLexer = new Lexer(allTokens);
