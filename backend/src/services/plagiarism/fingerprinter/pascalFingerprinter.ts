// Professional Pascal Plagiarism Detector
// Integrates TokenHash, RollingHash, WinnowFilter, and Region components
// for production-grade plagiarism detection

import { TokenHash } from "../hashing/tokenHash.js";
import { RollingHash } from "../hashing/rollingHash.js";
import { WinnowFilter} from "../hashing/winnowFilter.js";
import { Region } from "../util/region.js";
import { Fingerprint } from "../hashing/hashFilter.js";

// Enhanced interfaces building on the professional components
export interface TokenPosition {
  line: number;
  column: number;
  tokenIndex: number;
}

export interface EnhancedFingerprint extends Fingerprint {
  kgram?: string[];
  position: number;
}

export interface FingerprintData {
  fingerprints: Set<number>;
  fingerprintArray: number[];
  positionedFingerprints: EnhancedFingerprint[];
  regions: Region[];
}

export interface SharedRegion {
  file1Range: { start: number; end: number };
  file2Range: { start: number; end: number };
  file1Lines: { start: number; end: number };
  file2Lines: { start: number; end: number };
  sharedTokens: string[];
  confidence: number;
  region1: Region;
  region2: Region;
}

export interface SimilarityResult {
  similarity: number;
  overlapSimilarity1: number;
  overlapSimilarity2: number;
  sharedFingerprints: number;
  sharedRegions: SharedRegion[];
  qualityScore: number; // New metric combining multiple factors
}

export interface PlagiarismPair {
  file1: string;
  file2: string;
  similarity: number;
  overlapSimilarity1: number;
  overlapSimilarity2: number;
  sharedFingerprints: number;
  sharedRegions: SharedRegion[];
  qualityScore: number;
  confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
}

export interface PlagiarismResult {
  plagiarismDetected: boolean;
  suspiciousPairs: PlagiarismPair[];
  threshold: number;
  totalComparisons: number;
  processingTime: number;
  algorithmVersion: string;
}

export interface DetailedPlagiarismReport {
  file1: string;
  file2: string;
  similarity: number;
  overlapSimilarity1: number;
  overlapSimilarity2: number;
  sharedFingerprints: number;
  mappedRegions: MappedRegion[];
  totalSharedLines: number;
  qualityMetrics: QualityMetrics;
}

export interface MappedRegion {
  file1Lines: { start: number; end: number };
  file2Lines: { start: number; end: number };
  file1TokenRange: { start: number; end: number };
  file2TokenRange: { start: number; end: number };
  sharedTokens: string[];
  confidence: number;
  file1CodeSnippet: string;
  file2CodeSnippet: string;
  regionType: 'EXACT' | 'SIMILAR' | 'STRUCTURAL';
}

export interface QualityMetrics {
  hashCollisionRate: number;
  regionCoherence: number;
  temporalConsistency: number;
  structuralSimilarity: number;
}

export interface FileData {
  name: string;
  normalizedTokens: string[];
  originalCode: string;
  metadata?: {
    language: string;
    encoding: string;
    preprocessed: boolean;
  };
}

export class PascalPlagiarismDetector {
  private readonly kgramSize: number;
  private readonly windowSize: number;
  private readonly winnowFilter: WinnowFilter;
  private readonly tokenHash: TokenHash;
  private readonly fileFingerprints: Map<string, FingerprintData>;
  private readonly version = "2.0.0-professional";
  
  // Performance monitoring
  private performanceMetrics: {
    fingerprintGeneration: number;
    comparison: number;
    regionMapping: number;
  } = { fingerprintGeneration: 0, comparison: 0, regionMapping: 0 };

  constructor(kgramSize: number = 8, windowSize: number = 15) {
    if (windowSize < kgramSize) {
      throw new Error('Window size must be >= k-gram size');
    }
    
    this.kgramSize = kgramSize;
    this.windowSize = windowSize;
    this.winnowFilter = new WinnowFilter(kgramSize, windowSize, true);
    this.tokenHash = new TokenHash();
    this.fileFingerprints = new Map();
  }

  /**
   * Generate fingerprints using the professional winnowing implementation
   */
  private generateFingerprints(tokens: string[]): FingerprintData {
    const startTime = performance.now();
    
    if (tokens.length < this.kgramSize) {
      return {
        fingerprints: new Set(),
        fingerprintArray: [],
        positionedFingerprints: [],
        regions: []
      };
    }

    // Use the professional WinnowFilter
    const fingerprints = this.winnowFilter.fingerprints(tokens);
    
    // Convert to enhanced format with additional metadata
    const enhancedFingerprints: EnhancedFingerprint[] = fingerprints.map(fp => ({
      ...fp,
      position: fp.start,
      kgram: fp.data || []
    }));

    // Create regions from fingerprints for spatial analysis
    const regions = this.createRegionsFromFingerprints(enhancedFingerprints, tokens);

    this.performanceMetrics.fingerprintGeneration += performance.now() - startTime;

    return {
      fingerprints: new Set(fingerprints.map(f => f.hash)),
      fingerprintArray: fingerprints.map(f => f.hash),
      positionedFingerprints: enhancedFingerprints,
      regions
    };
  }

  /**
   * Create Region objects from fingerprints for advanced spatial analysis
   */
  private createRegionsFromFingerprints(fingerprints: EnhancedFingerprint[], tokens: string[]): Region[] {
    return fingerprints.map(fp => {
      const startPos = this.estimatePosition(fp.start, tokens);
      const endPos = this.estimatePosition(fp.stop, tokens);
      
      return new Region(
        startPos.line,
        startPos.column,
        endPos.line,
        endPos.column
      );
    });
  }

  /**
   * Estimate line/column position from token index
   */
  private estimatePosition(tokenIndex: number, tokens: string[]): { line: number; column: number } {
    // Simple estimation - in production, this would use the actual token positions
    // from the lexer/parser
    const estimatedLine = Math.floor(tokenIndex / 10) + 1; // Assume ~10 tokens per line
    const estimatedColumn = (tokenIndex % 10) + 1;
    
    return { line: estimatedLine, column: estimatedColumn };
  }

  /**
   * Advanced region finding using professional Region class
   */
  private findSharedRegions(
    fingerprints1: EnhancedFingerprint[],
    fingerprints2: EnhancedFingerprint[],
    tokens1: string[],
    tokens2: string[]
  ): SharedRegion[] {
    const startTime = performance.now();
    
    // Create hash-to-fingerprint mappings for efficient lookup
    const hashMap1 = new Map<number, EnhancedFingerprint[]>();
    const hashMap2 = new Map<number, EnhancedFingerprint[]>();

    for (const fp of fingerprints1) {
      if (!hashMap1.has(fp.hash)) hashMap1.set(fp.hash, []);
      hashMap1.get(fp.hash)!.push(fp);
    }

    for (const fp of fingerprints2) {
      if (!hashMap2.has(fp.hash)) hashMap2.set(fp.hash, []);
      hashMap2.get(fp.hash)!.push(fp);
    }

    // Find matching fingerprints
    const matches: Array<{
      fp1: EnhancedFingerprint;
      fp2: EnhancedFingerprint;
      distance: number;
    }> = [];

    for (const [hash, fps1] of hashMap1) {
      const fps2 = hashMap2.get(hash);
      if (fps2) {
        for (const fp1 of fps1) {
          for (const fp2 of fps2) {
            matches.push({
              fp1,
              fp2,
              distance: Math.abs(fp1.position - fp2.position)
            });
          }
        }
      }
    }

    if (matches.length === 0) {
      this.performanceMetrics.regionMapping += performance.now() - startTime;
      return [];
    }

    // Sort matches by position in first file for coherent region building
    matches.sort((a, b) => a.fp1.position - b.fp1.position);

    // Build regions using professional clustering
    const sharedRegions = this.clusterMatchesIntoRegions(matches, tokens1, tokens2);

    this.performanceMetrics.regionMapping += performance.now() - startTime;
    return sharedRegions;
  }

  /**
   * Advanced clustering algorithm to group matches into coherent regions
   */
  private clusterMatchesIntoRegions(
    matches: Array<{ fp1: EnhancedFingerprint; fp2: EnhancedFingerprint; distance: number }>,
    tokens1: string[],
    tokens2: string[]
  ): SharedRegion[] {
    const regions: SharedRegion[] = [];
    let currentCluster: typeof matches = [];

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      
      if (currentCluster.length === 0) {
        currentCluster.push(match);
        continue;
      }

      const lastMatch = currentCluster[currentCluster.length - 1];
      
      // Check if this match should be part of the current cluster
      const gap1 = match.fp1.position - lastMatch.fp1.stop;
      const gap2 = Math.abs(match.fp2.position - lastMatch.fp2.stop);
      const positionDrift = Math.abs(
        (match.fp1.position - lastMatch.fp1.position) - 
        (match.fp2.position - lastMatch.fp2.position)
      );

      // Advanced clustering criteria
      const shouldMerge = (
        gap1 <= this.kgramSize * 2 &&
        gap2 <= this.kgramSize * 2 &&
        positionDrift <= this.kgramSize // Maintain positional consistency
      );

      if (shouldMerge) {
        currentCluster.push(match);
      } else {
        // Finalize current cluster
        if (currentCluster.length >= 2) { // Require minimum cluster size
          regions.push(this.createSharedRegion(currentCluster, tokens1, tokens2));
        }
        currentCluster = [match];
      }
    }

    // Don't forget the last cluster
    if (currentCluster.length >= 2) {
      regions.push(this.createSharedRegion(currentCluster, tokens1, tokens2));
    }

    return this.mergeOverlappingRegions(regions);
  }

  /**
   * Create a SharedRegion from a cluster of matches
   */
  private createSharedRegion(
    cluster: Array<{ fp1: EnhancedFingerprint; fp2: EnhancedFingerprint; distance: number }>,
    tokens1: string[],
    tokens2: string[]
  ): SharedRegion {
    const positions1 = cluster.map(m => ({ start: m.fp1.start, stop: m.fp1.stop }));
    const positions2 = cluster.map(m => ({ start: m.fp2.start, stop: m.fp2.stop }));

    const file1Range = {
      start: Math.min(...positions1.map(p => p.start)),
      end: Math.max(...positions1.map(p => p.stop))
    };

    const file2Range = {
      start: Math.min(...positions2.map(p => p.start)),
      end: Math.max(...positions2.map(p => p.stop))
    };

    // Extract shared tokens
    const sharedTokens = tokens1.slice(file1Range.start, file1Range.end + 1);

    // Calculate confidence based on cluster coherence
    const regionLength = file1Range.end - file1Range.start + 1;
    const clusterDensity = cluster.length / Math.max(1, regionLength / this.kgramSize);
    const confidence = Math.min(1.0, clusterDensity * 0.8 + regionLength / (this.kgramSize * 5) * 0.2);

    // Create Region objects for advanced spatial operations
    const region1Pos = this.estimatePosition(file1Range.start, tokens1);
    const region1End = this.estimatePosition(file1Range.end, tokens1);
    const region2Pos = this.estimatePosition(file2Range.start, tokens2);
    const region2End = this.estimatePosition(file2Range.end, tokens2);

    const region1 = new Region(region1Pos.line, region1Pos.column, region1End.line, region1End.column);
    const region2 = new Region(region2Pos.line, region2Pos.column, region2End.line, region2End.column);

    return {
      file1Range,
      file2Range,
      file1Lines: { start: region1Pos.line, end: region1End.line },
      file2Lines: { start: region2Pos.line, end: region2End.line },
      sharedTokens,
      confidence,
      region1,
      region2
    };
  }

  /**
   * Merge overlapping regions using professional Region operations
   */
  private mergeOverlappingRegions(regions: SharedRegion[]): SharedRegion[] {
    if (regions.length <= 1) return regions;

    const merged: SharedRegion[] = [];
    const sorted = [...regions].sort((a, b) => a.file1Range.start - b.file1Range.start);

    let current = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      const next = sorted[i];

      // Check if regions overlap using professional Region class
      if (current.region1.overlapsWith(next.region1)) {
        // Merge regions
        const mergedRegion1 = Region.merge(current.region1, next.region1);
        const mergedRegion2 = Region.merge(current.region2, next.region2);

        current = {
          file1Range: {
            start: Math.min(current.file1Range.start, next.file1Range.start),
            end: Math.max(current.file1Range.end, next.file1Range.end)
          },
          file2Range: {
            start: Math.min(current.file2Range.start, next.file2Range.start),
            end: Math.max(current.file2Range.end, next.file2Range.end)
          },
          file1Lines: {
            start: mergedRegion1.startRow,
            end: mergedRegion1.endRow
          },
          file2Lines: {
            start: mergedRegion2.startRow,
            end: mergedRegion2.endRow
          },
          sharedTokens: [...current.sharedTokens, ...next.sharedTokens],
          confidence: Math.max(current.confidence, next.confidence),
          region1: mergedRegion1,
          region2: mergedRegion2
        };
      } else {
        merged.push(current);
        current = next;
      }
    }

    merged.push(current);
    return merged;
  }

  /**
   * Calculate comprehensive quality metrics
   */
  private calculateQualityMetrics(
    fingerprints1: FingerprintData,
    fingerprints2: FingerprintData,
    sharedRegions: SharedRegion[]
  ): QualityMetrics {
    // Hash collision rate estimation
    const totalHashes = fingerprints1.fingerprints.size + fingerprints2.fingerprints.size;
    const uniqueHashes = new Set([...fingerprints1.fingerprints, ...fingerprints2.fingerprints]).size;
    const hashCollisionRate = totalHashes > 0 ? 1 - (uniqueHashes / totalHashes) : 0;

    // Region coherence (how well clustered the shared regions are)
    const regionCoherence = sharedRegions.length > 0 
      ? sharedRegions.reduce((sum, region) => sum + region.confidence, 0) / sharedRegions.length
      : 0;

    // Temporal consistency (how well positions align across files)
    const temporalConsistency = this.calculateTemporalConsistency(sharedRegions);

    // Structural similarity (based on region distribution)
    const structuralSimilarity = this.calculateStructuralSimilarity(sharedRegions);

    return {
      hashCollisionRate,
      regionCoherence,
      temporalConsistency,
      structuralSimilarity
    };
  }

  private calculateTemporalConsistency(regions: SharedRegion[]): number {
    if (regions.length < 2) return 1.0;

    let consistencySum = 0;
    for (let i = 1; i < regions.length; i++) {
      const prev = regions[i - 1];
      const curr = regions[i];
      
      const expectedGap = curr.file1Range.start - prev.file1Range.end;
      const actualGap = curr.file2Range.start - prev.file2Range.end;
      const consistency = 1 - Math.min(1, Math.abs(expectedGap - actualGap) / this.kgramSize);
      
      consistencySum += consistency;
    }

    return consistencySum / (regions.length - 1);
  }

  private calculateStructuralSimilarity(regions: SharedRegion[]): number {
    if (regions.length === 0) return 0;

    // Calculate distribution of region sizes
    const sizes = regions.map(r => r.file1Range.end - r.file1Range.start + 1);
    const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;
    const variance = sizes.reduce((sum, size) => sum + Math.pow(size - avgSize, 2), 0) / sizes.length;
    
    // Lower variance indicates more structural similarity
    return Math.max(0, 1 - variance / (avgSize * avgSize));
  }

  /**
   * Enhanced comparison with professional components
   */
  public compareTwoFiles(tokens1: string[], tokens2: string[]): SimilarityResult {
    const startTime = performance.now();

    const fingerprints1 = this.generateFingerprints(tokens1);
    const fingerprints2 = this.generateFingerprints(tokens2);

    // Calculate traditional similarities
    const intersection = new Set([...fingerprints1.fingerprints]
      .filter(f => fingerprints2.fingerprints.has(f)));
    const union = new Set([...fingerprints1.fingerprints, ...fingerprints2.fingerprints]);

    const jaccardSimilarity = union.size > 0 ? intersection.size / union.size : 0;
    const overlapSim1 = fingerprints1.fingerprints.size > 0 
      ? intersection.size / fingerprints1.fingerprints.size : 0;
    const overlapSim2 = fingerprints2.fingerprints.size > 0 
      ? intersection.size / fingerprints2.fingerprints.size : 0;

    // Find shared regions using professional algorithms
    const sharedRegions = this.findSharedRegions(
      fingerprints1.positionedFingerprints,
      fingerprints2.positionedFingerprints,
      tokens1,
      tokens2
    );

    // Calculate comprehensive quality metrics
    const qualityMetrics = this.calculateQualityMetrics(fingerprints1, fingerprints2, sharedRegions);
    
    // Combine multiple factors into a quality score
    const qualityScore = (
      jaccardSimilarity * 0.4 +
      qualityMetrics.regionCoherence * 0.3 +
      qualityMetrics.temporalConsistency * 0.2 +
      qualityMetrics.structuralSimilarity * 0.1
    );

    this.performanceMetrics.comparison += performance.now() - startTime;

    return {
      similarity: jaccardSimilarity,
      overlapSimilarity1: overlapSim1,
      overlapSimilarity2: overlapSim2,
      sharedFingerprints: intersection.size,
      sharedRegions,
      qualityScore
    };
  }

  /**
   * Professional plagiarism detection with advanced metrics
   */
  public detectPlagiarism(files: FileData[]): PlagiarismResult {
    return this.detectPlagiarismWithThreshold(files);
  }

  public detectPlagiarismWithThreshold(
    files: FileData[],
    customThreshold?: number
  ): PlagiarismResult {
    const startTime = performance.now();
    
    this.fileFingerprints.clear();
    this.performanceMetrics = { fingerprintGeneration: 0, comparison: 0, regionMapping: 0 };
    
    const allComparisons: PlagiarismPair[] = [];

    // Generate fingerprints for all files
    for (const file of files) {
      this.fileFingerprints.set(file.name, this.generateFingerprints(file.normalizedTokens));
    }

    // Compare all pairs
    for (let i = 0; i < files.length; i++) {
      for (let j = i + 1; j < files.length; j++) {
        const comparison = this.compareTwoFiles(
          files[i].normalizedTokens,
          files[j].normalizedTokens
        );

        const confidenceLevel = this.determineConfidenceLevel(comparison.qualityScore);

        allComparisons.push({
          file1: files[i].name,
          file2: files[j].name,
          similarity: comparison.similarity,
          overlapSimilarity1: comparison.overlapSimilarity1,
          overlapSimilarity2: comparison.overlapSimilarity2,
          sharedFingerprints: comparison.sharedFingerprints,
          sharedRegions: comparison.sharedRegions,
          qualityScore: comparison.qualityScore,
          confidenceLevel
        });
      }
    }

    // Determine threshold using advanced statistics
    const threshold = customThreshold ?? this.calculateAdaptiveThreshold(allComparisons);

    // Filter suspicious pairs based on quality score and similarity
    const suspiciousPairs = allComparisons
      .filter(pair => pair.qualityScore >= threshold || pair.similarity >= threshold * 0.8)
      .sort((a, b) => b.qualityScore - a.qualityScore);

    const processingTime = performance.now() - startTime;

    return {
      plagiarismDetected: suspiciousPairs.length > 0,
      suspiciousPairs,
      threshold,
      totalComparisons: allComparisons.length,
      processingTime,
      algorithmVersion: this.version
    };
  }

  private determineConfidenceLevel(qualityScore: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' {
    if (qualityScore >= 0.8) return 'VERY_HIGH';
    if (qualityScore >= 0.6) return 'HIGH';
    if (qualityScore >= 0.4) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Enhanced adaptive threshold calculation
   */
  private calculateAdaptiveThreshold(comparisons: PlagiarismPair[]): number {
    if (comparisons.length === 0) return 0.3;

    const qualityScores = comparisons.map(c => c.qualityScore).sort((a, b) => b - a);
    const similarities = comparisons.map(c => c.similarity).sort((a, b) => b - a);

    // Use both quality scores and similarities for threshold calculation
    const meanQuality = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;
    const meanSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;

    const qualityVariance = qualityScores.reduce((sum, val) => sum + Math.pow(val - meanQuality, 2), 0) / qualityScores.length;
    const qualityStdDev = Math.sqrt(qualityVariance);

    // Combined threshold based on quality metrics
    let threshold = Math.max(0.25, meanQuality + 1.2 * qualityStdDev);
    
    // Ensure reasonable bounds
    threshold = Math.min(threshold, 0.75);
    threshold = Math.max(threshold, 0.2);

    return threshold;
  }

  /**
   * Get detailed plagiarism report with professional analysis
   */
  public getDetailedPlagiarismReport(
    file1Name: string,
    file1Tokens: string[],
    file1Code: string,
    file2Name: string,
    file2Tokens: string[],
    file2Code: string
  ): DetailedPlagiarismReport | null {
    const comparison = this.compareTwoFiles(file1Tokens, file2Tokens);

    if (comparison.sharedRegions.length === 0) {
      return null;
    }

    const mappedRegions: MappedRegion[] = comparison.sharedRegions.map(region => ({
      file1Lines: region.file1Lines,
      file2Lines: region.file2Lines,
      file1TokenRange: region.file1Range,
      file2TokenRange: region.file2Range,
      sharedTokens: region.sharedTokens,
      confidence: region.confidence,
      file1CodeSnippet: this.extractCodeSnippet(file1Code, region.file1Lines.start, region.file1Lines.end),
      file2CodeSnippet: this.extractCodeSnippet(file2Code, region.file2Lines.start, region.file2Lines.end),
      regionType: this.determineRegionType(region)
    }));

    const fingerprints1 = this.generateFingerprints(file1Tokens);
    const fingerprints2 = this.generateFingerprints(file2Tokens);
    const qualityMetrics = this.calculateQualityMetrics(fingerprints1, fingerprints2, comparison.sharedRegions);

    return {
      file1: file1Name,
      file2: file2Name,
      similarity: comparison.similarity,
      overlapSimilarity1: comparison.overlapSimilarity1,
      overlapSimilarity2: comparison.overlapSimilarity2,
      sharedFingerprints: comparison.sharedFingerprints,
      mappedRegions,
      totalSharedLines: mappedRegions.reduce((sum, region) => 
        sum + (region.file1Lines.end - region.file1Lines.start + 1), 0),
      qualityMetrics
    };
  }

  private determineRegionType(region: SharedRegion): 'EXACT' | 'SIMILAR' | 'STRUCTURAL' {
    if (region.confidence >= 0.9) return 'EXACT';
    if (region.confidence >= 0.7) return 'SIMILAR';
    return 'STRUCTURAL';
  }

  private extractCodeSnippet(code: string, startLine: number, endLine: number): string {
    const lines = code.split('\n');
    return lines.slice(Math.max(0, startLine - 1), Math.min(lines.length, endLine)).join('\n');
  }

  /**
   * Get performance metrics
   */
  public getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      total: Object.values(this.performanceMetrics).reduce((a, b) => a + b, 0),
      version: this.version
    };
  }

  /**
   * Professional code analysis with advanced region mapping
   */
  public analyzeCodeRegions(
    originalCode: string,
    tokens: string[],
    regions: SharedRegion[]
  ): string {
    const lines = originalCode.split('\n');
    let analysis = `🎯 Professional Code Analysis (v${this.version}):\n\n`;

    analysis += `📊 Summary:\n`;
    analysis += `   Total Regions: ${regions.length}\n`;
    analysis += `   Average Confidence: ${(regions.reduce((sum, r) => sum + r.confidence, 0) / regions.length * 100).toFixed(1)}%\n`;
    analysis += `   Performance: ${this.getPerformanceMetrics().total.toFixed(2)}ms\n\n`;

    regions.forEach((region, index) => {
      const regionType = this.determineRegionType(region);
      const typeEmoji = regionType === 'EXACT' ? '🎯' : regionType === 'SIMILAR' ? '🔍' : '📐';
      
      analysis += `${typeEmoji} Region ${index + 1} [${regionType}] (Confidence: ${(region.confidence * 100).toFixed(1)}%):\n`;
      analysis += `   Lines ${region.file1Lines.start}-${region.file1Lines.end} (${region.file1Lines.end - region.file1Lines.start + 1} lines)\n`;
      analysis += `   Tokens ${region.file1Range.start}-${region.file1Range.end} (${region.file1Range.end - region.file1Range.start + 1} tokens)\n`;

      // Show actual code
      for (let lineNum = region.file1Lines.start; lineNum <= region.file1Lines.end && lineNum <= lines.length; lineNum++) {
        if (lines[lineNum - 1]) {
          analysis += `   ${lineNum.toString().padStart(3)}: ${lines[lineNum - 1]}\n`;
        }
      }

      analysis += `   Sample Tokens: [${region.sharedTokens.slice(0, 8).join(', ')}${region.sharedTokens.length > 8 ? '...' : ''}]\n\n`;
    });

    return analysis;
  }
}