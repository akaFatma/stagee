// semantic/semanticAnalyzer.ts
import { TokenizedFile } from '../file/tokenizedFile';
import { PascalTokenizer } from '../tokenizer/tokenizer';

export interface SemanticFeatures {
  // Structure metrics
  procedureCount: number;
  functionCount: number;
  typeCount: number;
  variableCount: number;
  
  // Control flow metrics
  ifStatements: number;
  loopStatements: number;
  caseStatements: number;
  
  // Complexity metrics
  nestingDepth: number;
  cyclomaticComplexity: number;
  
  // Naming patterns
  identifierPatterns: string[];
  averageIdentifierLength: number;
  
  // Code patterns
  assignmentPatterns: string[];
  callPatterns: string[];
  
  // Semantic signatures
  procedureSignatures: string[];
  functionSignatures: string[];
  typeDefinitions: string[];
}

export interface SemanticSimilarity {
  structuralSimilarity: number;
  algorithmicSimilarity: number;
  styleSimilarity: number;
  overallSemanticSimilarity: number;
  details: {
    sharedProcedures: string[];
    sharedFunctions: string[];
    sharedTypes: string[];
    similarPatterns: string[];
    differenceReasons: string[];
  };
}

export class SemanticAnalyzer {
  private tokenizer: PascalTokenizer;

  constructor() {
    this.tokenizer = new PascalTokenizer();
  }

  

  /**
   * Extract semantic features from Pascal code
   */
  public extractSemanticFeatures(file: TokenizedFile): SemanticFeatures {
    const content = file.content;
    const tokens = file.tokens;
    
    // Get basic semantic info
    const semanticInfo = this.tokenizer.getSemanticInfo(content);
    
    // Analyze structure
    const structure = this.analyzeStructure(content, tokens);
    
    // Analyze control flow
    const controlFlow = this.analyzeControlFlow(tokens);
    
    // Analyze complexity
    const complexity = this.analyzeComplexity(content, tokens);
    
    // Analyze naming patterns
    const naming = this.analyzeNamingPatterns(content);
    
    // Analyze code patterns
    const patterns = this.analyzeCodePatterns(tokens);

    return {
      // Structure metrics
      procedureCount: semanticInfo.procedures.length,
      functionCount: semanticInfo.functions.length,
      typeCount: semanticInfo.types.length,
      variableCount: semanticInfo.variables.length,
      
      // Control flow metrics
      ifStatements: controlFlow.ifCount,
      loopStatements: controlFlow.loopCount,
      caseStatements: controlFlow.caseCount,
      
      // Complexity metrics
      nestingDepth: complexity.maxNesting,
      cyclomaticComplexity: complexity.cyclomaticComplexity,
      
      // Naming patterns
      identifierPatterns: naming.patterns,
      averageIdentifierLength: naming.averageLength,
      
      // Code patterns
      assignmentPatterns: patterns.assignments,
      callPatterns: patterns.calls,
      
      // Semantic signatures
      procedureSignatures: this.createProcedureSignatures(content),
      functionSignatures: this.createFunctionSignatures(content),
      typeDefinitions: this.createTypeSignatures(content)
    };
  }

  /**
   * Compare semantic features between two files
   */
  public compareSemanticFeatures(
    features1: SemanticFeatures, 
    features2: SemanticFeatures,
    file1Content: string,
    file2Content: string
  ): SemanticSimilarity {
    
    // Calculate structural similarity
    const structuralSim = this.calculateStructuralSimilarity(features1, features2);
    
    // Calculate algorithmic similarity
    const algorithmicSim = this.calculateAlgorithmicSimilarity(features1, features2);
    
    // Calculate style similarity
    const styleSim = this.calculateStyleSimilarity(features1, features2);
    
    // Calculate overall semantic similarity
    const overallSim = (structuralSim * 0.4 + algorithmicSim * 0.4 + styleSim * 0.2);
    
    // Find shared elements
    const sharedElements = this.findSharedElements(features1, features2);
    
    // Generate difference reasons
    const differences = this.generateDifferenceReasons(features1, features2);

    return {
      structuralSimilarity: structuralSim,
      algorithmicSimilarity: algorithmicSim,
      styleSimilarity: styleSim,
      overallSemanticSimilarity: overallSim,
      details: {
        sharedProcedures: sharedElements.procedures,
        sharedFunctions: sharedElements.functions,
        sharedTypes: sharedElements.types,
        similarPatterns: sharedElements.patterns,
        differenceReasons: differences
      }
    };
  }

  private analyzeStructure(content: string, tokens: string[]): any {
    const beginCount = tokens.filter(t => t === 'begin').length;
    const endCount = tokens.filter(t => t === 'end').length;
    
    return {
      beginEndBlocks: Math.min(beginCount, endCount),
      structuralBalance: Math.abs(beginCount - endCount) === 0 ? 1.0 : 0.8
    };
  }

  private analyzeControlFlow(tokens: string[]): any {
    const ifCount = tokens.filter(t => t === 'if').length;
    const forCount = tokens.filter(t => t === 'for').length;
    const whileCount = tokens.filter(t => t === 'while').length;
    const repeatCount = tokens.filter(t => t === 'repeat').length;
    const caseCount = tokens.filter(t => t === 'case').length;
    
    return {
      ifCount,
      loopCount: forCount + whileCount + repeatCount,
      caseCount
    };
  }

  private analyzeComplexity(content: string, tokens: string[]): any {
    // Calculate nesting depth by counting nested begin/end blocks
    const maxNesting = this.calculateMaxNesting(tokens);
    
    // Calculate cyclomatic complexity
    const cyclomaticComplexity = this.calculateCyclomaticComplexity(tokens);
    
    return {
      maxNesting,
      cyclomaticComplexity
    };
  }

  private calculateMaxNesting(tokens: string[]): number {
    let maxDepth = 0;
    let currentDepth = 0;
    
    for (const token of tokens) {
      if (token === 'begin' || token === 'if' || token === 'for' || 
          token === 'while' || token === 'repeat' || token === 'case') {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else if (token === 'end') {
        currentDepth = Math.max(0, currentDepth - 1);
      }
    }
    
    return maxDepth;
  }

  private calculateCyclomaticComplexity(tokens: string[]): number {
    // Base complexity of 1
    let complexity = 1;
    
    // Add 1 for each decision point
    const decisionTokens = ['if', 'for', 'while', 'repeat', 'case', 'and', 'or'];
    
    for (const token of tokens) {
      if (decisionTokens.includes(token)) {
        complexity++;
      }
    }
    
    return complexity;
  }

  private analyzeNamingPatterns(content: string): any {
    // Extract identifiers that aren't keywords
    const identifierMatches = content.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
    const pascalKeywords = new Set([
      'program', 'procedure', 'function', 'begin', 'end', 'if', 'then', 'else',
      'for', 'to', 'do', 'while', 'var', 'type', 'const', 'array', 'of', 'record'
    ]);
    
    const identifiers = identifierMatches.filter(id => !pascalKeywords.has(id.toLowerCase()));
    
    // Analyze patterns
    const patterns = [];
    let totalLength = 0;
    
    // Check for camelCase
    if (identifiers.some(id => /^[a-z][a-zA-Z0-9]*$/.test(id))) {
      patterns.push('camelCase');
    }
    
    // Check for PascalCase
    if (identifiers.some(id => /^[A-Z][a-zA-Z0-9]*$/.test(id))) {
      patterns.push('PascalCase');
    }
    
    // Check for snake_case
    if (identifiers.some(id => /^[a-z][a-z0-9_]*$/.test(id))) {
      patterns.push('snake_case');
    }
    
    // Check for Hungarian notation
    if (identifiers.some(id => /^[a-z]{1,3}[A-Z]/.test(id))) {
      patterns.push('hungarian');
    }
    
    for (const id of identifiers) {
      totalLength += id.length;
    }
    
    return {
      patterns,
      averageLength: identifiers.length > 0 ? totalLength / identifiers.length : 0
    };
  }

  private analyzeCodePatterns(tokens: string[]): any {
    const assignments = [];
    const calls = [];
    
    // Find assignment patterns
    for (let i = 0; i < tokens.length - 2; i++) {
      if (tokens[i + 1] === ':=') {
        const pattern = `${tokens[i]} := ${tokens[i + 2]}`;
        assignments.push(pattern);
      }
    }
    
    // Find call patterns (simplified)
    for (let i = 0; i < tokens.length - 1; i++) {
      if (tokens[i] === 'IDENTIFIER' && tokens[i + 1] === '(') {
        calls.push('function_call');
      }
    }
    
    return {
      assignments: assignments.slice(0, 10), // Limit to avoid too much data
      calls: calls.slice(0, 10)
    };
  }

  private createProcedureSignatures(content: string): string[] {
    const signatures = [];
    const procedureRegex = /procedure\s+(\w+)\s*(\([^)]*\))?\s*;/gi;
    let match;
    
    while ((match = procedureRegex.exec(content)) !== null) {
      const name = match[1];
      const params = match[2] || '()';
      signatures.push(`${name}${params}`);
    }
    
    return signatures;
  }

  private createFunctionSignatures(content: string): string[] {
    const signatures = [];
    const functionRegex = /function\s+(\w+)\s*(\([^)]*\))?\s*:\s*(\w+)\s*;/gi;
    let match;
    
    while ((match = functionRegex.exec(content)) !== null) {
      const name = match[1];
      const params = match[2] || '()';
      const returnType = match[3];
      signatures.push(`${name}${params}:${returnType}`);
    }
    
    return signatures;
  }

  private createTypeSignatures(content: string): string[] {
    const signatures = [];
    const typeRegex = /(\w+)\s*=\s*([^;]+);/gi;
    let match;
    
    // Find type definitions
    const typeSection = content.match(/type\s*\n([\s\S]*?)(?=\n\s*(var|const|procedure|function|begin|$))/gi);
    if (typeSection) {
      while ((match = typeRegex.exec(typeSection[0])) !== null) {
        const name = match[1];
        const definition = match[2].trim();
        signatures.push(`${name}=${definition}`);
      }
    }
    
    return signatures;
  }

  private calculateStructuralSimilarity(f1: SemanticFeatures, f2: SemanticFeatures): number {
    // Compare structural metrics
    const metrics = [
      this.normalizedSimilarity(f1.procedureCount, f2.procedureCount, 10),
      this.normalizedSimilarity(f1.functionCount, f2.functionCount, 10),
      this.normalizedSimilarity(f1.typeCount, f2.typeCount, 5),
      this.normalizedSimilarity(f1.variableCount, f2.variableCount, 20),
      this.normalizedSimilarity(f1.ifStatements, f2.ifStatements, 20),
      this.normalizedSimilarity(f1.loopStatements, f2.loopStatements, 10),
      this.normalizedSimilarity(f1.nestingDepth, f2.nestingDepth, 8)
    ];
    
    return metrics.reduce((sum, sim) => sum + sim, 0) / metrics.length;
  }

  private calculateAlgorithmicSimilarity(f1: SemanticFeatures, f2: SemanticFeatures): number {
    // Compare signatures and patterns
    const procSim = this.jaccard(new Set(f1.procedureSignatures), new Set(f2.procedureSignatures));
    const funcSim = this.jaccard(new Set(f1.functionSignatures), new Set(f2.functionSignatures));
    const typeSim = this.jaccard(new Set(f1.typeDefinitions), new Set(f2.typeDefinitions));
    const patternSim = this.jaccard(new Set(f1.assignmentPatterns), new Set(f2.assignmentPatterns));
    
    const complexitySim = this.normalizedSimilarity(f1.cyclomaticComplexity, f2.cyclomaticComplexity, 50);
    
    return (procSim * 0.3 + funcSim * 0.3 + typeSim * 0.2 + patternSim * 0.1 + complexitySim * 0.1);
  }

  private calculateStyleSimilarity(f1: SemanticFeatures, f2: SemanticFeatures): number {
    // Compare coding style
    const namingSim = this.jaccard(new Set(f1.identifierPatterns), new Set(f2.identifierPatterns));
    const lengthSim = this.normalizedSimilarity(f1.averageIdentifierLength, f2.averageIdentifierLength, 20);
    
    return (namingSim * 0.7 + lengthSim * 0.3);
  }

  private normalizedSimilarity(a: number, b: number, maxValue: number): number {
    const max = Math.max(a, b, 1);
    const min = Math.min(a, b);
    const raw = min / max;
    
    // Penalize very large differences
    const penalty = Math.abs(a - b) / maxValue;
    return Math.max(0, raw - penalty * 0.5);
  }

  private jaccard<T>(set1: Set<T>, set2: Set<T>): number {
    if (set1.size === 0 && set2.size === 0) return 1.0;
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  private findSharedElements(f1: SemanticFeatures, f2: SemanticFeatures) {
    const procedures = f1.procedureSignatures.filter(p => f2.procedureSignatures.includes(p));
    const functions = f1.functionSignatures.filter(f => f2.functionSignatures.includes(f));
    const types = f1.typeDefinitions.filter(t => f2.typeDefinitions.includes(t));
    const patterns = f1.assignmentPatterns.filter(p => f2.assignmentPatterns.includes(p));
    
    return { procedures, functions, types, patterns };
  }

  private generateDifferenceReasons(f1: SemanticFeatures, f2: SemanticFeatures): string[] {
    const reasons = [];
    
    if (Math.abs(f1.procedureCount - f2.procedureCount) > 2) {
      reasons.push(`Different number of procedures: ${f1.procedureCount} vs ${f2.procedureCount}`);
    }
    
    if (Math.abs(f1.functionCount - f2.functionCount) > 2) {
      reasons.push(`Different number of functions: ${f1.functionCount} vs ${f2.functionCount}`);
    }
    
    if (Math.abs(f1.cyclomaticComplexity - f2.cyclomaticComplexity) > 10) {
      reasons.push(`Different complexity levels: ${f1.cyclomaticComplexity} vs ${f2.cyclomaticComplexity}`);
    }
    
    if (Math.abs(f1.nestingDepth - f2.nestingDepth) > 3) {
      reasons.push(`Different nesting depths: ${f1.nestingDepth} vs ${f2.nestingDepth}`);
    }
    
    const namingDiff = this.jaccard(new Set(f1.identifierPatterns), new Set(f2.identifierPatterns));
    if (namingDiff < 0.3) {
      reasons.push(`Different naming conventions: ${f1.identifierPatterns.join(', ')} vs ${f2.identifierPatterns.join(', ')}`);
    }
    
    return reasons;
  }
}