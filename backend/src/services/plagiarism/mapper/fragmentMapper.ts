// Enhanced Fragment Mapping Implementation for Pascal Plagiarism Detection
import { PascalTokenizer } from '../tokenizer/tokenizer';
import { FingerprintIndex } from '../algorithm/fingerprintIndex';
import { TokenizedFile } from '../file/tokenizedFile';
import { File } from '../file/file';
import { Pair } from '../algorithm/pair';
import { Fragment } from '../algorithm/fragment';
import { Region } from '../util/region';

export interface DetailedFragment {
  // Fragment identification
  fragmentId: number;
  confidence: number;
  
  
  // Position information
  file1Range: { start: number; end: number; tokens: number };
  file2Range: { start: number; end: number; tokens: number };
  file1Lines: { start: number; end: number; count: number };
  file2Lines: { start: number; end: number; count: number };
  
  // Content analysis
  sharedTokens: string[];
  tokenPattern: string;
  sharedFingerprints: number;
  
  // Code snippets
  file1Code: string;
  file2Code: string;
  file1CodeWithHighlight: string;
  file2CodeWithHighlight: string;
  
  // Similarity metrics
  localSimilarity: number;
  tokenCoverage1: number;
  tokenCoverage2: number;
}

export interface FragmentMappingResult {
  // Overall analysis
  overallSimilarity: number;
  isPlagiarism: boolean;
 
  
  // Fragment details
  totalFragments: number;
  significantFragments: number;
  fragments: DetailedFragment[];
  
  // Coverage analysis
  file1Coverage: number;
  file2Coverage: number;
  totalSharedLines: number;
  totalSharedTokens: number;
  
  // Files
  file1Name: string;
  file2Name: string;
  file1TotalLines: number;
  file2TotalLines: number;
  file1TotalTokens: number;
  file2TotalTokens: number;
  
  // Algorithm parameters
  kgramSize: number;
  windowSize: number;
  threshold: number;
}

export class FragmentMapper {
  private tokenizer: PascalTokenizer;
  
  constructor() {
    this.tokenizer = new PascalTokenizer();
  }

  /**
   * Main method to detect plagiarism and map all shared fragments
   */
  public async mapSharedFragments(
    file1Name: string,
    file1Code: string,
    file2Name: string, 
    file2Code: string,
    kgramSize: number = 8,
    windowSize: number = 15,
    threshold: number = 0.3
  ): Promise<FragmentMappingResult> {
    
    console.log(`🔍 Starting fragment mapping analysis...`);
    console.log(`📊 Parameters: k-gram=${kgramSize}, window=${windowSize}, threshold=${threshold}`);
    
    // Step 1: Tokenize both files
    const tokenizedFile1 = this.tokenizer.tokenizeFile(file1Name, file1Code);
    const tokenizedFile2 = this.tokenizer.tokenizeFile(file2Name, file2Code);
    
    console.log(`📄 ${file1Name}: ${tokenizedFile1.tokens.length} tokens`);
    console.log(`📄 ${file2Name}: ${tokenizedFile2.tokens.length} tokens`);
    
    // Step 2: Create fingerprint index using Dolos algorithm
    const index = new FingerprintIndex(kgramSize, windowSize, true);
    index.addFiles([tokenizedFile1, tokenizedFile2]);
    
    // Step 3: Get pair analysis
    const pair = index.getPair(tokenizedFile1, tokenizedFile2);
    
    // Step 4: Build fragments with minimum occurrence threshold
    const fragments = pair.buildFragments(1);
    
    console.log(`🧩 Found ${fragments.length} raw fragments`);
    
    // Step 5: Process and enhance fragments
    const detailedFragments = this.enhanceFragments(
      fragments, 
      tokenizedFile1, 
      tokenizedFile2,
      file1Code,
      file2Code
    );
    
    // Step 6: Filter significant fragments
    const significantFragments = detailedFragments.filter(f => 
      f.confidence >= 0.3 && f.sharedTokens.length >= kgramSize
    );
    
    console.log(`🎯 ${significantFragments.length} significant fragments after filtering`);
    
    // Step 7: Calculate coverage and similarity metrics
    const result = this.calculateDetailedMetrics(
      pair,
      detailedFragments,
      significantFragments,
      tokenizedFile1,
      tokenizedFile2,
      file1Code,
      file2Code,
      kgramSize,
      windowSize,
      threshold
    );
    
    // Step 8: Sort fragments by significance
    result.fragments.sort((a, b) => b.confidence - a.confidence);
    
    console.log(`✅ Analysis complete. Overall similarity: ${(result.overallSimilarity * 100).toFixed(1)}%`);
    
    return result;
  }

  /**
   * Enhance fragments with detailed analysis
   */
  private enhanceFragments(
    fragments: Fragment[],
    tokenizedFile1: TokenizedFile,
    tokenizedFile2: TokenizedFile,
    file1Code: string,
    file2Code: string
  ): DetailedFragment[] {
    
    const file1Lines = file1Code.split('\n');
    const file2Lines = file2Code.split('\n');
    
    return fragments.map((fragment, index) => {
      // Extract basic fragment information
      const file1Start = fragment.leftkgrams.from;
      const file1End = fragment.leftkgrams.to;
      const file2Start = fragment.rightkgrams.from;
      const file2End = fragment.rightkgrams.to;
      
      // Get token ranges
      const file1TokenStart = fragment.pairs[0]?.left.start || file1Start;
      const file1TokenEnd = fragment.pairs[fragment.pairs.length - 1]?.left.stop || file1End;
      const file2TokenStart = fragment.pairs[0]?.right.start || file2Start;
      const file2TokenEnd = fragment.pairs[fragment.pairs.length - 1]?.right.stop || file2End;
      
      // Extract shared tokens
      const sharedTokens = tokenizedFile1.tokens.slice(file1TokenStart, file1TokenEnd + 1);
      
      // Calculate line ranges using mapping
      const file1LineStart = this.getLineNumber(file1TokenStart, tokenizedFile1);
      const file1LineEnd = this.getLineNumber(file1TokenEnd, tokenizedFile1);
      const file2LineStart = this.getLineNumber(file2TokenStart, tokenizedFile2);
      const file2LineEnd = this.getLineNumber(file2TokenEnd, tokenizedFile2);
      
      // Extract code snippets
      const file1Code_snippet = this.extractCodeSnippet(file1Lines, file1LineStart, file1LineEnd);
      const file2Code_snippet = this.extractCodeSnippet(file2Lines, file2LineStart, file2LineEnd);
      
      // Create highlighted versions
      const file1Highlighted = this.highlightCode(file1Code_snippet, file1LineStart);
      const file2Highlighted = this.highlightCode(file2Code_snippet, file2LineStart);
      
      // Calculate confidence based on fragment characteristics
      const confidence = this.calculateFragmentConfidence(fragment, sharedTokens.length);
      
      // Determine fragment type
      const fragmentType = this.determineFragmentType(confidence, sharedTokens);
      
      // Calculate local similarity
      const localSimilarity = this.calculateLocalSimilarity(fragment, sharedTokens.length);
      
      return {
        fragmentId: index + 1,
        confidence,
        fragmentType,
        
        file1Range: { 
          start: file1TokenStart, 
          end: file1TokenEnd, 
          tokens: file1TokenEnd - file1TokenStart + 1 
        },
        file2Range: { 
          start: file2TokenStart, 
          end: file2TokenEnd, 
          tokens: file2TokenEnd - file2TokenStart + 1 
        },
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
        
        sharedTokens,
        tokenPattern: this.createTokenPattern(sharedTokens),
        sharedFingerprints: fragment.pairs.length,
        
        file1Code: file1Code_snippet,
        file2Code: file2Code_snippet,
        file1CodeWithHighlight: file1Highlighted,
        file2CodeWithHighlight: file2Highlighted,
        
        localSimilarity,
        tokenCoverage1: (file1TokenEnd - file1TokenStart + 1) / tokenizedFile1.tokens.length,
        tokenCoverage2: (file2TokenEnd - file2TokenStart + 1) / tokenizedFile2.tokens.length
      };
    });
  }

  /**
   * Get line number from token index using mapping
   */
  private getLineNumber(tokenIndex: number, tokenizedFile: TokenizedFile): number {
    if (tokenIndex < 0 || tokenIndex >= tokenizedFile.mapping.length) {
      return 1;
    }
    return tokenizedFile.mapping[tokenIndex]?.startRow || 1;
  }

  /**
   * Extract code snippet between line numbers
   */
  private extractCodeSnippet(lines: string[], startLine: number, endLine: number): string {
    const start = Math.max(0, startLine - 1);
    const end = Math.min(lines.length, endLine);
    return lines.slice(start, end).join('\n');
  }

  /**
   * Create highlighted version of code
   */
  private highlightCode(code: string, startLine: number): string {
    const lines = code.split('\n');
    return lines.map((line, index) => {
      const lineNumber = startLine + index;
      return `${lineNumber.toString().padStart(3)}: ${line}`;
    }).join('\n');
  }

  /**
   * Calculate fragment confidence based on various factors
   */
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

  /**
   * Determine fragment type based on characteristics
   */
  private determineFragmentType(confidence: number, sharedTokens: string[]): 'EXACT' | 'SIMILAR' | 'STRUCTURAL' {
    if (confidence >= 0.8) return 'EXACT';
    if (confidence >= 0.6) return 'SIMILAR';
    return 'STRUCTURAL';
  }

  /**
   * Calculate local similarity for this fragment
   */
  private calculateLocalSimilarity(fragment: Fragment, tokenCount: number): number {
    const pairCount = fragment.pairs.length;
    const maxPossiblePairs = Math.max(1, tokenCount);
    return Math.min(1.0, pairCount / maxPossiblePairs);
  }

  /**
   * Create a readable token pattern
   */
  private createTokenPattern(tokens: string[]): string {
    if (tokens.length === 0) return '';
    
    // Show first few and last few tokens if long
    if (tokens.length > 20) {
      const start = tokens.slice(0, 10).join(' ');
      const end = tokens.slice(-10).join(' ');
      return `${start} ... ${end}`;
    }
    
    return tokens.join(' ');
  }

  /**
   * Calculate comprehensive metrics
   */
  private calculateDetailedMetrics(
    pair: Pair,
    allFragments: DetailedFragment[],
    significantFragments: DetailedFragment[],
    tokenizedFile1: TokenizedFile,
    tokenizedFile2: TokenizedFile,
    file1Code: string,
    file2Code: string,
    kgramSize: number,
    windowSize: number,
    threshold: number
  ): FragmentMappingResult {
    
    // Calculate coverage
    const file1CoveredTokens = new Set<number>();
    const file2CoveredTokens = new Set<number>();
    
    significantFragments.forEach(fragment => {
      for (let i = fragment.file1Range.start; i <= fragment.file1Range.end; i++) {
        file1CoveredTokens.add(i);
      }
      for (let i = fragment.file2Range.start; i <= fragment.file2Range.end; i++) {
        file2CoveredTokens.add(i);
      }
    });
    
    const file1Coverage = file1CoveredTokens.size / tokenizedFile1.tokens.length;
    const file2Coverage = file2CoveredTokens.size / tokenizedFile2.tokens.length;
    
    // Calculate total shared lines and tokens
    const totalSharedLines = significantFragments.reduce((sum, f) => sum + f.file1Lines.count, 0);
    const totalSharedTokens = significantFragments.reduce((sum, f) => sum + f.sharedTokens.length, 0);
    
    // Overall similarity from pair analysis
    const overallSimilarity = pair.similarity;
    
    // Determine plagiarism verdict
    const isPlagiarism = overallSimilarity >= threshold;
    const confidenceLevel = this.determineOverallConfidence(overallSimilarity, significantFragments.length);
    
    return {
      overallSimilarity,
      isPlagiarism,
      
      
      totalFragments: allFragments.length,
      significantFragments: significantFragments.length,
      fragments: significantFragments,
      
      file1Coverage,
      file2Coverage,
      totalSharedLines,
      totalSharedTokens,
      
      file1Name: tokenizedFile1.file.path,
      file2Name: tokenizedFile2.file.path,
      file1TotalLines: file1Code.split('\n').length,
      file2TotalLines: file2Code.split('\n').length,
      file1TotalTokens: tokenizedFile1.tokens.length,
      file2TotalTokens: tokenizedFile2.tokens.length,
      
      kgramSize,
      windowSize,
      threshold
    };
  }

  /**
   * Determine overall confidence level
   */
  private determineOverallConfidence(similarity: number, fragmentCount: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' {
    let score = 0;
    
    // Similarity contribution
    if (similarity >= 0.8) score += 4;
    else if (similarity >= 0.6) score += 3;
    else if (similarity >= 0.4) score += 2;
    else score += 1;
    
    // Fragment count contribution
    if (fragmentCount >= 10) score += 3;
    else if (fragmentCount >= 5) score += 2;
    else if (fragmentCount >= 2) score += 1;
    
    if (score >= 6) return 'VERY_HIGH';
    if (score >= 4) return 'HIGH';
    if (score >= 2) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Generate a detailed textual report of fragments
   */
  public generateFragmentReport(result: FragmentMappingResult): string {
    let report = `\n🎯 DETAILED FRAGMENT MAPPING REPORT\n`;
    report += `${'='.repeat(60)}\n\n`;
    
    // Header information
    report += `📁 Files: ${result.file1Name} ↔ ${result.file2Name}\n`;
    
  
    report += `🧩 Significant Fragments: ${result.significantFragments}/${result.totalFragments}\n\n`;
    
    // Coverage analysis
    report += `📋 Coverage Analysis:\n`;
    report += `   • File 1 Token Coverage: ${(result.file1Coverage * 100).toFixed(1)}%\n`;
    report += `   • File 2 Token Coverage: ${(result.file2Coverage * 100).toFixed(1)}%\n`;
    report += `   • Total Shared Lines: ${result.totalSharedLines}\n`;
    report += `   • Total Shared Tokens: ${result.totalSharedTokens}\n\n`;
    
    // Algorithm parameters
    report += `⚙️  Algorithm Parameters:\n`;
    report += `   • K-gram Size: ${result.kgramSize}\n`;
    report += `   • Window Size: ${result.windowSize}\n`;
    report += `   • Threshold: ${(result.threshold * 100).toFixed(0)}%\n\n`;
    
    // Detailed fragment analysis
    if (result.fragments.length > 0) {
      report += `🔍 DETAILED FRAGMENT ANALYSIS:\n`;
      report += `${'-'.repeat(60)}\n\n`;
      
      result.fragments.forEach((fragment, index) => {
        
        
        
        report += `   Confidence: ${(fragment.confidence * 100).toFixed(1)}%\n`;
        report += `   Local Similarity: ${(fragment.localSimilarity * 100).toFixed(1)}%\n`;
        report += `   Shared Fingerprints: ${fragment.sharedFingerprints}\n\n`;
        
        report += `   📍 Position Mapping:\n`;
        report += `   ${result.file1Name}:\n`;
        report += `     • Lines: ${fragment.file1Lines.start}-${fragment.file1Lines.end} (${fragment.file1Lines.count} lines)\n`;
        report += `     • Tokens: ${fragment.file1Range.start}-${fragment.file1Range.end} (${fragment.file1Range.tokens} tokens)\n`;
        
        report += `   ${result.file2Name}:\n`;
        report += `     • Lines: ${fragment.file2Lines.start}-${fragment.file2Lines.end} (${fragment.file2Lines.count} lines)\n`;
        report += `     • Tokens: ${fragment.file2Range.start}-${fragment.file2Range.end} (${fragment.file2Range.tokens} tokens)\n\n`;
        
        report += `   📝 Code from ${result.file1Name}:\n`;
        report += this.indentText(fragment.file1CodeWithHighlight, '   ') + '\n\n';
        
        report += `   📝 Code from ${result.file2Name}:\n`;
        report += this.indentText(fragment.file2CodeWithHighlight, '   ') + '\n\n';
        
        report += `   🔤 Token Pattern:\n`;
        report += `   "${fragment.tokenPattern}"\n\n`;
        
        if (index < result.fragments.length - 1) {
          report += `${'-'.repeat(40)}\n\n`;
        }
      });
    } else {
      report += `✅ No significant shared fragments detected.\n\n`;
    }
    
    return report;
  }

  /**
   * Helper method to indent text
   */
  private indentText(text: string, indent: string): string {
    return text.split('\n').map(line => indent + line).join('\n');
  }
}

// Example usage function
export async function demonstrateFragmentMapping() {
  const mapper = new FragmentMapper();
  
  // Sample Pascal codes for testing
  const code1 = `
program StudentManager;
type
  Student = record
    name: string;
    grades: array[1..3] of integer;
    average: real;
  end;
var
  students: array[1..3] of Student;
  i, j, total: integer;
begin
  for i := 1 to 3 do
  begin
    total := 0;
    for j := 1 to 3 do
    begin
      total := total + students[i].grades[j];
    end;
    students[i].average := total / 3.0;
  end;
end.`;

  const code2 = `
program ManageStudents;
type
  TStudent = record
    fullName: string;
    marks: array[1..3] of integer;
    avg: real;
  end;
var
  sList: array[1..3] of TStudent;
  idx, k, sumMarks: integer;
begin
  for idx := 1 to 3 do
  begin
    sumMarks := 0;
    for k := 1 to 3 do
    begin
      sumMarks := sumMarks + sList[idx].marks[k];
    end;
    sList[idx].avg := sumMarks / 3.0;
  end;
end.`;
  
  try {
    const result = await mapper.mapSharedFragments(
      'student1.pas',
      code1,
      'student2.pas', 
      code2,
      8,  // k-gram size
      15, // window size
      0.3 // threshold
    );
    
    console.log(mapper.generateFragmentReport(result));
    
    // Return result for further processing
    return result;
  } catch (error) {
    console.error('Fragment mapping failed:', error);
    throw error;
  }
}