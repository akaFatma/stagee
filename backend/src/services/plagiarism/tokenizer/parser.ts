import Parser from 'tree-sitter';
import * as Pascal from './tree-sitter-pascal';
import * as path from 'path';

export class PascalParser {
  private parser: Parser;
  
  constructor() {
    this.parser = new Parser();
    this.loadLanguage();
  }

  
  
  private loadLanguage() {
    // Path compiled grammar
    const grammarPath = path.join(__dirname, './tree-sitter-pascal/build/Release/tree_sitter_pascal_binding.node');
    
    try {
      const Pascal = require(grammarPath);
      this.parser.setLanguage(Pascal);
    } catch (error) {
      console.error('Failed to load Pascal grammar:', error);
      throw new Error('Could not load Pascal grammar. Make sure it\'s compiled.');
    }
  }
  
  parse(sourceCode: string): Parser.Tree {
    return this.parser.parse(sourceCode);
  }
}
