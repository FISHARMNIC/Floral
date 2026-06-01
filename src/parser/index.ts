import { daisyLangLexer } from './lexer';
import { parser } from './chevrotainParser';
import { CSTPrinter } from './cstPrinter';
import * as ast from './ast';

export class DaisyParser {
  parse(code: string): ast.Program {
    const lexResult = daisyLangLexer.tokenize(code);

    if (lexResult.errors.length > 0) {
      throw new Error(`Lexer errors: ${lexResult.errors.map((e: any) => e.message).join(', ')}`);
    }

    parser.input = lexResult.tokens;
    const cst = parser.program();

    if (parser.errors.length > 0) {
      throw new Error(`Parser errors: ${parser.errors.map((e: any) => e.message).join(', ')}`);
    }

    const printer = new CSTPrinter();
    const astProgram = printer.visit(cst) as ast.Program;

    return astProgram;
  }
}
