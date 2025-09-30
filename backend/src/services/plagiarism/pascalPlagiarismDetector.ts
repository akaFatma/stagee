// Enhanced detector/pascalPlagiarismDetector.ts with integrated fragment mapping
import { PascalTokenizer } from '../../tokenizer/tokenizer';
import { FingerprintIndex } from '../fingerprintIndex';
import { TokenizedFile } from '../../file/tokenizedFile';
import { File } from '../../file/file';
import { Pair } from '../pair';
import { Fragment } from '../fragment';
import { Region } from '../../util/region';

// Enhanced interfaces that include fragment mapping
export interface MappedFragment {
  fragmentId: number;
  confidence: number;
  fragmentType: 'EXACT' | 'SIMILAR' | 'STRUCTURAL';
  
  // Position information
  file1Lines: { start: number; end: number; count: number };
  file2Lines: { start: number; end: number; count: number };
  file1TokenRange: { start: number; end: number; tokens: number };
  file2TokenRange: { start: number; end: number; tokens: number };
  
  // Content
  sharedTokens: string[];
  tokenPattern: string;
  file1CodeSnippet: string;
  file2CodeSnippet: string;
  file1CodeWithLineNumbers: string;
  file2CodeWithLineNumbers: string;
  
  // Metrics
  localSimilarity: number;
  sharedFingerprints: number;
}

export interface PlagiarismResult {
  // Basic similarity metrics
  syntacticSimilarity: number;
  overallSimilarity: number;
  
  // Detailed analysis
  sharedFragments: number;
  longestFragment: number;
  coverage1: number;
  coverage2: number;
  
  // NEW: Fragment mapping results
  mappedFragments: MappedFragment[];
  totalMappedFragments: number;
  significantMappedFragments: number;
  totalSharedLines: number;
  totalSharedTokens: number;
  
  // Plagiarism assessment
  isPlagiarism: boolean;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  
  // Additional info
  file1: string;
  file2: string;
  processingTime: number;
}

export interface BatchResult {
  results: PlagiarismResult[];
  threshold: number;
  totalComparisons: number;
  suspiciousPairs: number;
  processingTime: number;
}

export interface FileInput {
  name: string;
  content: string;
  metadata?: {
    author?: string;
    timestamp?: Date;
    language?: string;
  };
}

export class PascalPlagiarismDetector {
  private tokenizer: PascalTokenizer;
  private initialized = false;

  // Algorithm parameters
  private kgramSize: number;
  private windowSize: number;
  private syntacticWeight: number;

  constructor(
    kgramSize = 8,
    windowSize = 15,
    syntacticWeight = 1.0
  ) {
    this.kgramSize = kgramSize;
    this.windowSize = windowSize;
    this.syntacticWeight = syntacticWeight;
    
    this.tokenizer = new PascalTokenizer();
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    console.log('🔧 Initializing Pascal Plagiarism Detector...');
    
    try {
      this.tokenizer = new PascalTokenizer();
      this.initialized = true;
      console.log('✅ Pascal Plagiarism Detector initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize detector:', error);
      throw error;
    }
  }

  /**
   * Enhanced plagiarism detection with integrated fragment mapping
   */
  public async detectPlagiarism(
    file1: FileInput,
    file2: FileInput,
    customThreshold?: number
  ): Promise<PlagiarismResult> {
    const startTime = performance.now();
    
    if (!this.initialized) {
      await this.initialize();
    }

    console.log(`🔍 Analyzing ${file1.name} vs ${file2.name}...`);

    // Step 1: Tokenize both files
    const tokenizedFile1 = this.tokenizer.tokenizeFile(file1.name, file1.content);
    const tokenizedFile2 = this.tokenizer.tokenizeFile(file2.name, file2.content);

    console.log(`📄 File 1: ${tokenizedFile1.tokens.length} tokens`);
    console.log(`📄 File 2: ${tokenizedFile2.tokens.length} tokens`);

    // Step 2: Perform syntactic analysis
    const syntacticResult = this.performSyntacticAnalysis([tokenizedFile1, tokenizedFile2]);
    
    // Step 3: Build and map fragments
    const mappingResult = this.mapFragments(
      syntacticResult.pair, 
      tokenizedFile1, 
      tokenizedFile2, 
      file1.content, 
      file2.content
    );

    // Step 4: Calculate overall similarity and determine plagiarism
    const overallSimilarity = syntacticResult.similarity * this.syntacticWeight;
    const threshold = customThreshold ?? this.calculateAdaptiveThreshold(syntacticResult.similarity, mappingResult.mappedFragments.length);
    const isPlagiarism = overallSimilarity >= threshold;
    const confidence = this.determineConfidence(overallSimilarity, syntacticResult, mappingResult);

    const processingTime = performance.now() - startTime;

    console.log(`📊 Syntactic similarity: ${(syntacticResult.similarity * 100).toFixed(1)}%`);
    console.log(`📊 Overall similarity: ${(overallSimilarity * 100).toFixed(1)}%`);
    console.log(`🧩 Mapped fragments: ${mappingResult.significantMappedFragments}/${mappingResult.totalMappedFragments}`);
    console.log(`📄 Shared lines: ${mappingResult.totalSharedLines}`);
    console.log(`⚖️  Plagiarism detected: ${isPlagiarism ? 'YES' : 'NO'} (${confidence} confidence)`);

    return {
      syntacticSimilarity: syntacticResult.similarity,
      overallSimilarity,
      
      sharedFragments: syntacticResult.sharedFingerprints,
      longestFragment: syntacticResult.longestFragment,
      coverage1: syntacticResult.coverage1,
      coverage2: syntacticResult.coverage2,
      
      // NEW: Fragment mapping results
      mappedFragments: mappingResult.mappedFragments,
      totalMappedFragments: mappingResult.totalMappedFragments,
      significantMappedFragments: mappingResult.significantMappedFragments,
      totalSharedLines: mappingResult.totalSharedLines,
      totalSharedTokens: mappingResult.totalSharedTokens,
      
      isPlagiarism,
      confidence,
      
      file1: file1.name,
      file2: file2.name,
      processingTime
    };
  }

  /**
   * Perform syntactic analysis and return enhanced results with pair object
   */
  private performSyntacticAnalysis(files: TokenizedFile[]): {
    similarity: number;
    sharedFingerprints: number;
    longestFragment: number;
    coverage1: number;
    coverage2: number;
    pair: Pair; // Return the pair for fragment mapping
  } {
    // Create fingerprint index using Dolos algorithm
    const index = new FingerprintIndex(this.kgramSize, this.windowSize, true);
    
    // Add files to index
    index.addFiles(files);
    
    // Get pair analysis
    const pair = index.getPair(files[0], files[1]);
    
    return {
      similarity: pair.similarity,
      sharedFingerprints: pair.overlap,
      longestFragment: pair.longest,
      coverage1: pair.leftCovered / Math.max(1, pair.leftTotal),
      coverage2: pair.rightCovered / Math.max(1, pair.rightTotal),
      pair: pair // Include pair for fragment mapping
    };
  }

  /**
   * NEW: Map fragments from the pair analysis
   */
  private mapFragments(
    pair: Pair,
    tokenizedFile1: TokenizedFile,
    tokenizedFile2: TokenizedFile,
    file1Code: string,
    file2Code: string
  ): {
    mappedFragments: MappedFragment[];
    totalMappedFragments: number;
    significantMappedFragments: number;
    totalSharedLines: number;
    totalSharedTokens: number;
  } {
    
    // Build fragments from the pair
    const fragments: Fragment[] = pair.buildFragments(1); // Minimum 1 occurrence
    
    console.log(`🧩 Found ${fragments.length} raw fragments`);
    
    // Map each fragment to detailed information
    const mappedFragments: MappedFragment[] = fragments.map((fragment: Fragment, index: number) => 
      this.createMappedFragment(fragment, index + 1, tokenizedFile1, tokenizedFile2, file1Code, file2Code)
    );
    
    // Filter significant fragments
    const significantFragments: MappedFragment[] = mappedFragments.filter((f: MappedFragment) => 
      f.confidence >= 0.3 && f.sharedTokens.length >= this.kgramSize
    );
    
    // Calculate totals
    const totalSharedLines = significantFragments.reduce((sum: number, f: MappedFragment) => sum + f.file1Lines.count, 0);
    const totalSharedTokens = significantFragments.reduce((sum: number, f: MappedFragment) => sum + f.sharedTokens.length, 0);
    
    console.log(`🎯 ${significantFragments.length} significant fragments after filtering`);
    
    return {
      mappedFragments: significantFragments,
      totalMappedFragments: mappedFragments.length,
      significantMappedFragments: significantFragments.length,
      totalSharedLines,
      totalSharedTokens
    };
  }

  /**
   * NEW: Create a detailed mapped fragment from a raw fragment
   */
  private createMappedFragment(
    fragment: Fragment,
    fragmentId: number,
    tokenizedFile1: TokenizedFile,
    tokenizedFile2: TokenizedFile,
    file1Code: string,
    file2Code: string
  ): MappedFragment {
    
    // Extract token ranges
    const file1TokenStart = fragment.pairs[0]?.left.start || fragment.leftkgrams.from;
    const file1TokenEnd = fragment.pairs[fragment.pairs.length - 1]?.left.stop || fragment.leftkgrams.to - 1;
    const file2TokenStart = fragment.pairs[0]?.right.start || fragment.rightkgrams.from;
    const file2TokenEnd = fragment.pairs[fragment.pairs.length - 1]?.right.stop || fragment.rightkgrams.to - 1;
    
    // Extract shared tokens
    const sharedTokens = tokenizedFile1.tokens.slice(file1TokenStart, file1TokenEnd + 1);
    
    // Get line ranges using mapping
    const file1LineStart = this.getLineNumber(file1TokenStart, tokenizedFile1);
    const file1LineEnd = this.getLineNumber(file1TokenEnd, tokenizedFile1);
    const file2LineStart = this.getLineNumber(file2TokenStart, tokenizedFile2);
    const file2LineEnd = this.getLineNumber(file2TokenEnd, tokenizedFile2);
    
    // Extract code snippets
    const file1Lines = file1Code.split('\n');
    const file2Lines = file2Code.split('\n');
    const file1Snippet = this.extractCodeSnippet(file1Lines, file1LineStart, file1LineEnd);
    const file2Snippet = this.extractCodeSnippet(file2Lines, file2LineStart, file2LineEnd);
    
    // Create line-numbered versions
    const file1WithNumbers = this.addLineNumbers(file1Snippet, file1LineStart);
    const file2WithNumbers = this.addLineNumbers(file2Snippet, file2LineStart);
    
    // Calculate confidence and type
    const confidence = this.calculateFragmentConfidence(fragment, sharedTokens.length);
    const fragmentType = this.determineFragmentType(confidence);
    const localSimilarity = fragment.pairs.length / Math.max(1, sharedTokens.length / this.kgramSize);
    
    return {
      fragmentId,
      confidence,
      fragmentType,
      
      file1Lines: {
        start: file1LineStart,
        end: file1LineEnd,
        count: file1LineEnd - file1LineStart + 1
      },
      file2Lines: {
        start: file2LineStart,
        end: file2LineEnd,
        count: file2LineEnd - file2LineStart + 1
      },
      file1TokenRange: {
        start: file1TokenStart,
        end: file1TokenEnd,
        tokens: file1TokenEnd - file1TokenStart + 1
      },
      file2TokenRange: {
        start: file2TokenStart,
        end: file2TokenEnd,
        tokens: file2TokenEnd - file2TokenStart + 1
      },
      
      sharedTokens,
      tokenPattern: this.createTokenPattern(sharedTokens),
      file1CodeSnippet: file1Snippet,
      file2CodeSnippet: file2Snippet,
      file1CodeWithLineNumbers: file1WithNumbers,
      file2CodeWithLineNumbers: file2WithNumbers,
      
      localSimilarity: Math.min(1.0, localSimilarity),
      sharedFingerprints: fragment.pairs.length
    };
  }

  /**
   * Helper methods for fragment mapping
   */
  private getLineNumber(tokenIndex: number, tokenizedFile: TokenizedFile): number {
    if (tokenIndex < 0 || tokenIndex >= tokenizedFile.mapping.length) {
      return 1;
    }
    return tokenizedFile.mapping[tokenIndex]?.startRow || 1;
  }

  private extractCodeSnippet(lines: string[], startLine: number, endLine: number): string {
    const start = Math.max(0, startLine - 1);
    const end = Math.min(lines.length, endLine);
    return lines.slice(start, end).join('\n');
  }

  private addLineNumbers(code: string, startLine: number): string {
    const lines = code.split('\n');
    return lines.map((line, index) => {
      const lineNumber = startLine + index;
      return `${lineNumber.toString().padStart(3)}: ${line}`;
    }).join('\n');
  }

  private calculateFragmentConfidence(fragment: Fragment, tokenCount: number): number {
    let confidence = 0;
    
    // Base confidence from fragment length
    confidence += Math.min(0.4, tokenCount / 50);
    
    // Bonus for multiple paired occurrences
    confidence += Math.min(0.3, fragment.pairs.length * 0.1);
    
    // Bonus for consecutive fingerprints (coherence)
    const kgramRange = fragment.leftkgrams.length;
    const expectedPairs = Math.max(1, kgramRange);
    const coherence = fragment.pairs.length / expectedPairs;
    confidence += Math.min(0.3, coherence * 0.3);
    
    return Math.min(1.0, confidence);
  }

  private determineFragmentType(confidence: number): 'EXACT' | 'SIMILAR' | 'STRUCTURAL' {
    if (confidence >= 0.8) return 'EXACT';
    if (confidence >= 0.6) return 'SIMILAR';
    return 'STRUCTURAL';
  }

  private createTokenPattern(tokens: string[]): string {
    if (tokens.length === 0) return '';
    
    if (tokens.length > 20) {
      const start = tokens.slice(0, 10).join(' ');
      const end = tokens.slice(-10).join(' ');
      return `${start} ... ${end}`;
    }
    
    return tokens.join(' ');
  }

  private calculateAdaptiveThreshold(syntactic: number, fragmentCount: number): number {
    let threshold = 0.3;
    
    // Adjust based on similarity and fragment count
    if (syntactic > 0.8 && fragmentCount > 5) {
      threshold = 0.7;
    } else if (syntactic > 0.6 && fragmentCount > 3) {
      threshold = 0.5;
    } else if (syntactic > 0.4 && fragmentCount > 1) {
      threshold = 0.35;
    }
    
    return threshold;
  }

  private determineConfidence(
    overallSimilarity: number,
    syntactic: any,
    mapping: any
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' {
    
    let confidenceScore = 0;
    
    // Overall similarity weight
    if (overallSimilarity > 0.8) confidenceScore += 4;
    else if (overallSimilarity > 0.6) confidenceScore += 3;
    else if (overallSimilarity > 0.4) confidenceScore += 2;
    else confidenceScore += 1;
    
    // Syntactic factors
    if (syntactic.similarity > 0.7) confidenceScore += 2;
    if (syntactic.longestFragment > 10) confidenceScore += 1;
    if (syntactic.coverage1 > 0.5 || syntactic.coverage2 > 0.5) confidenceScore += 1;
    
    // Fragment mapping factors
    if (mapping.significantMappedFragments > 5) confidenceScore += 2;
    if (mapping.totalSharedLines > 20) confidenceScore += 1;
    
    if (confidenceScore >= 8) return 'VERY_HIGH';
    if (confidenceScore >= 6) return 'HIGH';
    if (confidenceScore >= 4) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Enhanced report generation with fragment mapping
   */
  public static generateReport(result: PlagiarismResult): string {
    let report = `\n🎯 PASCAL PLAGIARISM ANALYSIS REPORT\n`;
    report += `${'='.repeat(50)}\n\n`;
    
    report += `📁 Files Analyzed:\n`;
    report += `   • ${result.file1}\n`;
    report += `   • ${result.file2}\n\n`;
    
    report += `📊 Similarity Metrics:\n`;
    report += `   • Syntactic Similarity: ${(result.syntacticSimilarity * 100).toFixed(1)}%\n`;
    report += `   • Overall Similarity: ${(result.overallSimilarity * 100).toFixed(1)}%\n\n`;
    
    report += `🔍 Syntactic Analysis:\n`;
    report += `   • Shared Fragments: ${result.sharedFragments}\n`;
    report += `   • Longest Fragment: ${result.longestFragment} tokens\n`;
    report += `   • Coverage File 1: ${(result.coverage1 * 100).toFixed(1)}%\n`;
    report += `   • Coverage File 2: ${(result.coverage2 * 100).toFixed(1)}%\n\n`;
    
    // NEW: Fragment mapping section
    if (result.mappedFragments.length > 0) {
      report += `🧩 MAPPED FRAGMENTS ANALYSIS:\n`;
      report += `   • Total Mapped Fragments: ${result.totalMappedFragments}\n`;
      report += `   • Significant Fragments: ${result.significantMappedFragments}\n`;
      report += `   • Total Shared Lines: ${result.totalSharedLines}\n`;
      report += `   • Total Shared Tokens: ${result.totalSharedTokens}\n\n`;
      
      report += `📋 DETAILED FRAGMENT BREAKDOWN:\n`;
      report += `${'-'.repeat(50)}\n\n`;
      
      result.mappedFragments.forEach((fragment, index) => {
        const typeEmoji = fragment.fragmentType === 'EXACT' ? '🎯' : 
                         fragment.fragmentType === 'SIMILAR' ? '🔍' : '📐';
        
        report += `${typeEmoji} Fragment ${fragment.fragmentId} [${fragment.fragmentType}]:\n`;
        report += `   Confidence: ${(fragment.confidence * 100).toFixed(1)}%\n`;
        report += `   Local Similarity: ${(fragment.localSimilarity * 100).toFixed(1)}%\n`;
        report += `   Shared Fingerprints: ${fragment.sharedFingerprints}\n`;
        report += `   Shared Tokens: ${fragment.sharedTokens.length}\n\n`;
        
        report += `   📍 Position Mapping:\n`;
        report += `   ${result.file1}: Lines ${fragment.file1Lines.start}-${fragment.file1Lines.end} (${fragment.file1Lines.count} lines)\n`;
        report += `   ${result.file2}: Lines ${fragment.file2Lines.start}-${fragment.file2Lines.end} (${fragment.file2Lines.count} lines)\n\n`;
        
        report += `   📝 Code from ${result.file1}:\n`;
        report += fragment.file1CodeWithLineNumbers.split('\n').map(line => `   ${line}`).join('\n') + '\n\n';
        
        report += `   📝 Code from ${result.file2}:\n`;
        report += fragment.file2CodeWithLineNumbers.split('\n').map(line => `   ${line}`).join('\n') + '\n\n';
        
        report += `   🔤 Token Pattern:\n`;
        report += `   "${fragment.tokenPattern}"\n\n`;
        
        if (index < result.mappedFragments.length - 1) {
          report += `${'-'.repeat(30)}\n\n`;
        }
      });
    }
    
    report += `\n⚖️  Final Assessment:\n`;
    report += `   • Plagiarism Detected: ${result.isPlagiarism ? '🚨 YES' : '✅ NO'}\n`;
    report += `   • Confidence Level: ${result.confidence}\n`;
    report += `   • Processing Time: ${result.processingTime.toFixed(2)}ms\n\n`;
    
    if (result.isPlagiarism) {
      report += `🚨 PLAGIARISM ALERT: These files show significant similarity!\n`;
      if (result.mappedFragments.length > 0) {
        report += `   Evidence: ${result.significantMappedFragments} mapped fragments covering ${result.totalSharedLines} lines\n`;
      }
      report += `   Recommended action: Manual review required.\n\n`;
    } else {
      report += `✅ No significant plagiarism detected.\n\n`;
    }
    
    return report;
  }

  // Existing methods remain the same...
  public async detectBatchPlagiarism(
    files: FileInput[],
    customThreshold?: number
  ): Promise<BatchResult> {
    const startTime = performance.now();
    
    if (!this.initialized) {
      await this.initialize();
    }

    console.log(`🔍 Batch analysis of ${files.length} files (${files.length * (files.length - 1) / 2} comparisons)...`);

    const results: PlagiarismResult[] = [];
    let totalComparisons = 0;
    let suspiciousPairs = 0;

    // Compare all pairs
    for (let i = 0; i < files.length; i++) {
      for (let j = i + 1; j < files.length; j++) {
        totalComparisons++;
        console.log(`📋 Comparing ${files[i].name} vs ${files[j].name} (${totalComparisons}/${files.length * (files.length - 1) / 2})`);
        
        const result = await this.detectPlagiarism(files[i], files[j], customThreshold);
        results.push(result);
        
        if (result.isPlagiarism) {
          suspiciousPairs++;
        }
      }
    }

    const threshold = customThreshold ?? this.calculateBatchThreshold(results);
    const processingTime = performance.now() - startTime;

    console.log(`\n📈 Batch Analysis Summary:`);
    console.log(`   Total comparisons: ${totalComparisons}`);
    console.log(`   Suspicious pairs: ${suspiciousPairs}`);
    console.log(`   Threshold: ${(threshold * 100).toFixed(1)}%`);
    console.log(`   Processing time: ${processingTime.toFixed(2)}ms`);

    return {
      results: results.sort((a, b) => b.overallSimilarity - a.overallSimilarity),
      threshold,
      totalComparisons,
      suspiciousPairs,
      processingTime
    };
  }

  private calculateBatchThreshold(results: PlagiarismResult[]): number {
    if (results.length === 0) return 0.3;
    
    const similarities = results.map(r => r.overallSimilarity).sort((a, b) => b - a);
    const mean = similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length;
    const variance = similarities.reduce((sum, sim) => sum + Math.pow(sim - mean, 2), 0) / similarities.length;
    const stdDev = Math.sqrt(variance);
    
    let threshold = Math.max(0.25, mean + 1.5 * stdDev);
    threshold = Math.min(threshold, 0.8);
    
    return threshold;
  }

  public getConfig(): any {
    return {
      kgramSize: this.kgramSize,
      windowSize: this.windowSize,
      syntacticWeight: this.syntacticWeight,
      version: '2.1.0',
      algorithm: 'Dolos-inspired syntactic analysis with integrated fragment mapping'
    };
  }
}