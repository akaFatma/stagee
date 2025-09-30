import { Region } from "../util/region";

// Tree-sitter node interface
interface TreeSitterNode {
  type: string;
  text: string;
  startPosition: { row: number; column: number };
  endPosition: { row: number; column: number };
  children?: TreeSitterNode[];
  namedChildren?: TreeSitterNode[];
}

interface SymbolInfo {
  type: 'variable' | 'function' | 'procedure' | 'type' | 'constant';
  normalizedName: string;
  declarationLine: number;
}

export interface DolosTokenResult {
  tokens: Array<string>;
  mapping: Array<Region>;
}

export class PascalNormalizer {
  private symbolTable = new Map<string, SymbolInfo>();
  private variableCounter = 0;
  private functionCounter = 0;
  private procedureCounter = 0;
  private typeCounter = 0;
  private constantCounter = 0;
  
  private readonly builtInTypes = new Set([
    'integer', 'real', 'boolean', 'char', 'string', 'text', 'byte', 'word', 'longint'
  ]);
  
  private readonly builtInFunctions = new Set([
    'write', 'writeln', 'read', 'readln', 'length', 'copy', 'pos', 'val', 'str',
    'abs', 'sqr', 'sqrt', 'sin', 'cos', 'ln', 'exp', 'trunc', 'round', 'random',
    'ord', 'chr', 'succ', 'pred', 'odd', 'eof', 'eoln'
  ]);

  // Map tree-sitter node types to normalized tokens
  private readonly nodeTokenMap = new Map<string, string>([
    // Keywords
    ['kProgram', 'PROGRAM'],
    ['kBegin', 'BEGIN'], 
    ['kEnd', 'END'],
    ['kVar', 'VAR'],
    ['kConst', 'CONST'],
    ['kType', 'TYPE'],
    ['kFunction', 'FUNCTION'],
    ['kProcedure', 'PROCEDURE'],
    
    // Control structures
    ['kIf', 'IF'],
    ['kThen', 'THEN'],
    ['kElse', 'ELSE'],
    ['kWhile', 'WHILE'],
    ['kFor', 'FOR'],
    ['kTo', 'TO'],
    ['kDownto', 'DOWNTO'],
    ['kDo', 'DO'],
    ['kRepeat', 'REPEAT'],
    ['kUntil', 'UNTIL'],
    ['kCase', 'CASE'],
    ['kOf', 'OF'],
    
    // Operators
    ['kAssign', 'ASSIGN'],
    ['kEq', 'EQ'],
    ['kNe', 'NEQ'],
    ['kLt', 'LT'],
    ['kGt', 'GT'],
    ['kLe', 'LEQ'],
    ['kGe', 'GEQ'],
    ['kPlus', 'PLUS'],
    ['kMinus', 'MINUS'],
    ['kMul', 'MUL'],
    ['kDiv', 'DIV'],
    ['kMod', 'MOD'],
    ['kAnd', 'AND'],
    ['kOr', 'OR'],
    ['kNot', 'NOT'],
    
    // Delimiters
    ['kSemicolon', 'SEMI'],
    ['kDot', 'DOT'],
    ['kComma', 'COMMA'],
    ['kColon', 'COLON'],
    ['kLParen', 'LPAREN'],
    ['kRParen', 'RPAREN'],
    ['kLBracket', 'LBRACKET'],
    ['kRBracket', 'RBRACKET'],
  ]);

  normalize(rootNode: TreeSitterNode): DolosTokenResult {
    this.reset();
    
    // First pass: build symbol table
    this.buildSymbolTable(rootNode);
    
    // Second pass: extract tokens with regions
    const tokens: string[] = [];
    const mapping: Region[] = [];
    
    this.traverseAndTokenize(rootNode, tokens, mapping);
    
    return { tokens, mapping };
  }

  private reset(): void {
    this.symbolTable.clear();
    this.variableCounter = 0;
    this.functionCounter = 0;
    this.procedureCounter = 0;
    this.typeCounter = 0;
    this.constantCounter = 0;
  }

  private buildSymbolTable(node: TreeSitterNode): void {
    const traverse = (n: TreeSitterNode) => {
      // Look for declaration patterns
      this.extractDeclarations(n);
      
      // Recursively traverse
      const children = n.namedChildren || n.children || [];
      for (const child of children) {
        traverse(child);
      }
    };
    
    traverse(node);
  }

  private extractDeclarations(node: TreeSitterNode): void {
    switch (node.type) {
      case 'declTypes':
        this.extractTypeDeclarations(node);
        break;
      case 'declVars': 
        this.extractVariableDeclarations(node);
        break;
      case 'declConsts':
        this.extractConstantDeclarations(node);
        break;
      case 'declFunc':
        this.extractFunctionDeclaration(node);
        break;
      case 'declProc':
        this.extractProcedureDeclaration(node);
        break;
    }
  }

  private extractTypeDeclarations(node: TreeSitterNode): void {
    const identifiers = this.findNodesByType(node, 'identifier');
    for (const identifier of identifiers) {
      const typeName = identifier.text.toLowerCase();
      if (!this.symbolTable.has(typeName) && !this.builtInTypes.has(typeName)) {
        const normalizedName = `T${this.typeCounter++}`;
        this.symbolTable.set(typeName, {
          type: 'type',
          normalizedName,
          declarationLine: identifier.startPosition.row + 1
        });
      }
    }
  }

  private extractVariableDeclarations(node: TreeSitterNode): void {
    const identifiers = this.findNodesByType(node, 'identifier');
    for (const identifier of identifiers) {
      const varName = identifier.text.toLowerCase();
      if (!this.symbolTable.has(varName) && !this.builtInTypes.has(varName)) {
        const normalizedName = `V${this.variableCounter++}`;
        this.symbolTable.set(varName, {
          type: 'variable',
          normalizedName,
          declarationLine: identifier.startPosition.row + 1
        });
      }
    }
  }

  private extractConstantDeclarations(node: TreeSitterNode): void {
    const identifiers = this.findNodesByType(node, 'identifier');
    for (const identifier of identifiers) {
      const constName = identifier.text.toLowerCase();
      if (!this.symbolTable.has(constName)) {
        const normalizedName = `C${this.constantCounter++}`;
        this.symbolTable.set(constName, {
          type: 'constant',
          normalizedName,
          declarationLine: identifier.startPosition.row + 1
        });
      }
    }
  }

  private extractFunctionDeclaration(node: TreeSitterNode): void {
    const identifiers = this.findNodesByType(node, 'identifier');
    if (identifiers.length > 0) {
      const funcName = identifiers[0].text.toLowerCase(); // First identifier is usually the function name
      if (!this.symbolTable.has(funcName) && !this.builtInFunctions.has(funcName)) {
        const normalizedName = `F${this.functionCounter++}`;
        this.symbolTable.set(funcName, {
          type: 'function',
          normalizedName,
          declarationLine: identifiers[0].startPosition.row + 1
        });
      }
    }
  }

  private extractProcedureDeclaration(node: TreeSitterNode): void {
    const identifiers = this.findNodesByType(node, 'identifier');
    if (identifiers.length > 0) {
      const procName = identifiers[0].text.toLowerCase();
      if (!this.symbolTable.has(procName) && !this.builtInFunctions.has(procName)) {
        const normalizedName = `P${this.procedureCounter++}`;
        this.symbolTable.set(procName, {
          type: 'procedure',
          normalizedName,
          declarationLine: identifiers[0].startPosition.row + 1
        });
      }
    }
  }

  private findNodesByType(node: TreeSitterNode, type: string): TreeSitterNode[] {
    const results: TreeSitterNode[] = [];
    
    const traverse = (n: TreeSitterNode) => {
      if (n.type === type) {
        results.push(n);
      }
      
      const children = n.namedChildren || n.children || [];
      for (const child of children) {
        traverse(child);
      }
    };
    
    traverse(node);
    return results;
  }

  private traverseAndTokenize(
    node: TreeSitterNode, 
    tokens: string[], 
    mapping: Region[]
  ): void {
    // Skip structural nodes that don't contribute to semantic meaning
    if (this.shouldSkipNode(node)) {
      const children = node.namedChildren || node.children || [];
      for (const child of children) {
        this.traverseAndTokenize(child, tokens, mapping);
      }
      return;
    }

    const normalizedToken = this.normalizeNode(node);
    if (normalizedToken) {
      tokens.push(normalizedToken);
      mapping.push(new Region(
        node.startPosition.row,
        node.startPosition.column,
        node.endPosition.row,
        node.endPosition.column
      ));
    }

    // Continue with children
    const children = node.namedChildren || node.children || [];
    for (const child of children) {
      this.traverseAndTokenize(child, tokens, mapping);
    }
  }

  private shouldSkipNode(node: TreeSitterNode): boolean {
    // Skip structural containers that don't represent actual tokens
    const skipTypes = [
      'root', 'program', 'declTypes', 'declVars', 'declConsts', 
      'declFunc', 'declProc', 'declType', 'declClass', 'moduleName'
    ];
    return skipTypes.includes(node.type);
  }

  private normalizeNode(node: TreeSitterNode): string | null {
    // Map known node types to tokens
    const mappedToken = this.nodeTokenMap.get(node.type);
    if (mappedToken) {
      return mappedToken;
    }

    // Handle identifiers
    if (node.type === 'identifier') {
      const lowerText = node.text.toLowerCase();
      
      // Check symbol table
      const symbolInfo = this.symbolTable.get(lowerText);
      if (symbolInfo) {
        return symbolInfo.normalizedName;
      }
      
      // Built-in functions
      if (this.builtInFunctions.has(lowerText)) {
        return lowerText.toUpperCase();
      }
      
      // Built-in types
      if (this.builtInTypes.has(lowerText)) {
        return lowerText.toUpperCase();
      }
      
      // Unknown identifier - might be a parameter or undeclared variable
      return 'ID';
    }

    // Handle literals
    if (node.type === 'number' || node.type === 'integer' || node.type === 'real') {
      return 'NUM';
    }
    
    if (node.type === 'string' || node.type === 'char') {
      return 'STR';
    }
    
    if (node.type === 'boolean' || node.text.toLowerCase() === 'true' || node.text.toLowerCase() === 'false') {
      return 'BOOL';
    }

    // For unknown nodes, we might want to include them as-is or skip them
    // This depends on how comprehensive your tree-sitter grammar is
    return null;
  }
}