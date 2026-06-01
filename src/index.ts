import { RemoveType, Walker } from './compiler/walker';
import { DaisyParser } from './parser';
import fs from 'fs';

export * as AST from './parser/ast';

const parser = new DaisyParser();

const ast = parser.parse(fs.readFileSync("examples/messages2.flower", "utf-8"))

const walker = new Walker();

console.dir(ast,{depth:null})

const result = RemoveType(walker.visit(ast));

console.log(result);
