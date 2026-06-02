import { createToken, Lexer } from 'chevrotain';

// Keywords
export const Let = createToken({ name: 'Let', pattern: /let\b/ });
export const Function = createToken({ name: 'Function', pattern: /function\b/ });
export const Return = createToken({ name: 'Return', pattern: /return\b/ });
export const If = createToken({ name: 'If', pattern: /if\b/ });
export const Else = createToken({ name: 'Else', pattern: /else\b/ });
export const True = createToken({ name: 'True', pattern: /true\b/ });
export const False = createToken({ name: 'False', pattern: /false\b/ });
export const String = createToken({ name: 'String', pattern: /String\b/ });
export const Integer = createToken({ name: 'Integer', pattern: /Integer\b/ });
export const Boolean = createToken({ name: 'Boolean', pattern: /Boolean\b/ });
export const Float = createToken({ name: 'Float', pattern: /Float\b/ });
export const Spawn = createToken({ name: 'Spawn', pattern: /spawn\b/ });
export const Await = createToken({ name: 'Await', pattern: /await\b/ });
export const Lam = createToken({ name: 'Lam', pattern: /lam\b/ });
export const Include = createToken({ name: 'Include', pattern: /#INCLUDE/ });
export const Cpp = createToken({ name: 'Cpp', pattern: /#CPP/ });
export const While = createToken({ name: 'While', pattern: /while\b/ });
export const Elif = createToken({ name: 'Elif', pattern: /elif\b/ });
export const Break = createToken({ name: 'Break', pattern: /break\b/ });
export const Shared = createToken({ name: 'Shared', pattern: /shared\b/ });
export const Type = createToken({ name: 'Type', pattern: /type\b/ });
export const None = createToken({ name: 'None', pattern: /None\b/ });
export const End = createToken({ name: 'End', pattern: /end\b/ });

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
export const EqualEqual = createToken({ name: 'EqualEqual', pattern: /==/ });
export const NotEqual = createToken({ name: 'NotEqual', pattern: /!=/ });
export const Equals = createToken({ name: 'Equals', pattern: /=/ });
export const Plus = createToken({ name: 'Plus', pattern: /\+/ });
export const Minus = createToken({ name: 'Minus', pattern: /-/ });
export const Star = createToken({ name: 'Star', pattern: /\*/ });
export const Slash = createToken({ name: 'Slash', pattern: /\// });
export const Dollar = createToken({ name: 'Dollar', pattern: /\$/ });

// Literals - order matters! C++ block and strings must be before CPP keyword
export const StringLiteral = createToken({
  name: 'StringLiteral',
  pattern: /"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'/,
});

export const IntegerLiteral = createToken({ name: 'IntegerLiteral', pattern: /[0-9]+/ });
export const FloatLiteral = createToken({ name: 'FloatLiteral', pattern: /[0-9]+\.[0-9]+/ });
export const Identifier = createToken({ name: 'Identifier', pattern: /[a-zA-Z_][a-zA-Z0-9_]*/ });

// Whitespace (spaces and tabs only - NOT newlines, those are tracked separately)
export const WhiteSpace = createToken({
  name: 'WhiteSpace',
  pattern: /[ \t]+/,
});

// Comments
export const Comment = createToken({
  name: 'Comment',
  pattern: /\/\/[^\n]*/,
  group: Lexer.SKIPPED,
});


// INDENT/DEDENT tokens must come before other tokens in allTokens
// Note: These are exported so the parser can use the same token objects
export const Indent = createToken({ name: 'Indent', pattern: Lexer.NA });
export const Dedent = createToken({ name: 'Dedent', pattern: Lexer.NA });

// Newline token - skip in output
export const Newline = createToken({
  name: 'Newline',
  pattern: /\n/,
  group: Lexer.SKIPPED,
});

// Version of Comment that's skipped
const CommentSkipped = createToken({
  name: 'Comment',
  pattern: /\/\/[^\n]*/,
  group: Lexer.SKIPPED,
});

// Version of WhiteSpace that's skipped
const WhiteSpaceSkipped = createToken({
  name: 'WhiteSpace',
  pattern: /[ \t]+/,
  group: Lexer.SKIPPED,
});

export const allTokens = [
  Dedent,
  Indent,
  Newline,
  CommentSkipped,
  Include,
  Cpp,
  Type,
  Function,
  Let,
  Return,
  If,
  Else,
  Elif,
  While,
  Break,
  End,
  Spawn,
  Await,
  Shared,
  Lam,
  Arrow,
  String,
  Integer,
  Boolean,
  Float,
  None,
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
  EqualEqual,
  NotEqual,
  Equals,
  Plus,
  Minus,
  Star,
  Slash,
  Dollar,
  FloatLiteral,
  IntegerLiteral,
  StringLiteral,
  Identifier,
  WhiteSpaceSkipped,
];

// Tokens for indentation-aware lexing (whitespace not skipped)
const CommentNoSkip = createToken({
  name: 'Comment',
  pattern: /\/\/[^\n]*/,
});

export const allTokensForIndent = [
  Dedent,
  Indent,
  Newline,
  CommentNoSkip,
  Include,
  Cpp,
  Type,
  Function,
  Let,
  Return,
  If,
  Else,
  Elif,
  While,
  Break,
  End,
  Spawn,
  Await,
  Shared,
  Lam,
  Arrow,
  String,
  Integer,
  Boolean,
  Float,
  None,
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
  EqualEqual,
  NotEqual,
  Equals,
  Plus,
  Minus,
  Star,
  Slash,
  Dollar,
  FloatLiteral,
  IntegerLiteral,
  StringLiteral,
  Identifier,
  WhiteSpace,  // Not skipped
];

// Custom indentation tracking using closure state
function createIndentDedentMatcher() {
  const indentStack = [0];
  let isFirstOnLine = true;

  return (text: string, offset: number, matchedTokens: any[], groups: any) => {
    // Check if we just saw a newline (or this is the start)
    if (isFirstOnLine) {
      // Measure leading whitespace at current position
      const spacesMatch = text.slice(offset).match(/^[ \t]*/);
      const spaces = spacesMatch ? spacesMatch[0].replace(/\t/g, '    ').length : 0;

      const prevIndent = indentStack[indentStack.length - 1];

      if (spaces > prevIndent) {
        // INDENT
        indentStack.push(spaces);
        isFirstOnLine = false;
        return [text.slice(offset, offset + (spacesMatch?.[0].length || 0)) || ' '];
      } else if (spaces < prevIndent) {
        // This will be handled by Dedent matching
        isFirstOnLine = false;
        return null;
      } else {
        isFirstOnLine = false;
        return null;
      }
    }
    return null;
  };
}

function createDedentMatcher() {
  const indentStack = [0];
  let isFirstOnLine = true;

  return (text: string, offset: number, matchedTokens: any[], groups: any) => {
    // Check if we just saw a newline
    if (isFirstOnLine) {
      const spacesMatch = text.slice(offset).match(/^[ \t]*/);
      const spaces = spacesMatch ? spacesMatch[0].replace(/\t/g, '    ').length : 0;

      const prevIndent = indentStack[indentStack.length - 1];

      if (spaces < prevIndent) {
        indentStack.pop();
        return [' ']; // Return something to trigger token
      }
      isFirstOnLine = false;
      return null;
    }
    return null;
  };
}

export const daisyLangLexer = new Lexer(allTokens);
export const unskippedLexer = new Lexer(allTokensForIndent);

function createIndentToken(baseToken: any): any {
  return {
    tokenType: Indent,
    image: '',
    offset: baseToken.startOffset,
    startOffset: baseToken.startOffset,
    endOffset: baseToken.startOffset,
    startLine: baseToken.startLine,
    endLine: baseToken.startLine,
    startColumn: baseToken.startColumn,
    endColumn: baseToken.startColumn,
    text: '',
  };
}

function createDedentToken(baseToken: any): any {
  return {
    tokenType: Dedent,
    image: '',
    offset: baseToken.startOffset,
    startOffset: baseToken.startOffset,
    endOffset: baseToken.startOffset,
    startLine: baseToken.startLine,
    endLine: baseToken.startLine,
    startColumn: baseToken.startColumn,
    endColumn: baseToken.startColumn,
    text: '',
  };
}

export function tokenizeWithIndentation(code: string): any {
  // First tokenize without skipping whitespace to detect indentation
  const rawResult = unskippedLexer.tokenize(code);

  if (rawResult.errors.length > 0) {
    return rawResult;
  }

  const tokens = rawResult.tokens;
  const processedTokens: any[] = [];
  const indentStack = [0];
  let lastWasNewline = true;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // Track newlines to know when we're at line start
    if (token.tokenType.name === 'Newline') {
      lastWasNewline = true;
      // Don't add newlines to final token stream
      continue;
    }

    // Check for indentation changes when we see whitespace after newline
    if (token.tokenType.name === 'WhiteSpace' && lastWasNewline) {
      // This whitespace is indentation at line start
      const indent = token.image.replace(/\t/g, '    ').length;
      const prevIndent = indentStack[indentStack.length - 1];

      if (indent > prevIndent) {
        indentStack.push(indent);
        processedTokens.push(createIndentToken(token));
      } else if (indent < prevIndent) {
        while (indentStack.length > 1 && indentStack[indentStack.length - 1] > indent) {
          indentStack.pop();
          processedTokens.push(createDedentToken(token));
        }
      }
      lastWasNewline = false;
      continue;
    }

    // Skip whitespace that's not indentation
    if (token.tokenType.name === 'WhiteSpace') {
      continue;
    }

    // Handle non-whitespace token after newline (zero indentation case)
    if (lastWasNewline && token.tokenType.name !== 'Newline') {
      const indent = 0; // No whitespace means zero indentation
      const prevIndent = indentStack[indentStack.length - 1];

      if (indent < prevIndent) {
        // Emit Dedent tokens for any indentation levels we're exiting
        while (indentStack.length > 1 && indentStack[indentStack.length - 1] > indent) {
          indentStack.pop();
          processedTokens.push(createDedentToken(token));
        }
      }
      lastWasNewline = false;
    }

    processedTokens.push(token);
    lastWasNewline = false;
  }

  // Emit remaining DEDENT tokens at EOF
  while (indentStack.length > 1) {
    indentStack.pop();
    const lastToken = tokens[tokens.length - 1];
    const endOffset = (lastToken?.endOffset ?? 0) + 1;
    const endLine = lastToken?.endLine ?? 1;
    processedTokens.push({
      tokenType: Dedent,
      image: '',
      offset: endOffset,
      startOffset: endOffset,
      endOffset: endOffset,
      startLine: endLine,
      endLine: endLine,
      startColumn: 0,
      endColumn: 0,
    });
  }

  return {
    tokens: processedTokens,
    errors: [],
  };
}
