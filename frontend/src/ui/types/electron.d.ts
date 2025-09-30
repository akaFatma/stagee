// src/ui/types/electron.d.ts

interface ElectronAPI {
    // File Operations
    openFiles: () => Promise<{
      success: boolean
      files: Array<{
        name: string
        content: string
        size: number
        path: string
        lastModified: Date
      }>
      error?: string
    }>
  
    // Plagiarism Detection
    detectPlagiarism: (
      file1: FileInput,
      file2: FileInput
    ) => Promise<{
      success: boolean
      result?: PlagiarismResult
      error?: string
    }>
  
    detectBatchPlagiarism: (
      files: FileInput[],
      options?: { threshold?: number }
    ) => Promise<{
      success: boolean
      result?: BatchPlagiarismResult
      error?: string
    }>
  
    // Configuration
    getDetectorConfig: () => Promise<{
      success: boolean
      config?: DetectorConfig
      error?: string
    }>
  
    // Utility
    isElectron: boolean
  }
  
  interface FileInput {
    name: string
    content: string
    metadata?: {
      author?: string
      timestamp?: Date
      language?: string
    }
  }
  
  interface PlagiarismResult {
    // Basic similarity metrics
    syntacticSimilarity: number
    overallSimilarity: number
    
    // Detailed analysis
    sharedFragments: number
    longestFragment: number
    coverage1: number
    coverage2: number
    
    // Fragment mapping results
    mappedFragments?: MappedFragment[]
    totalMappedFragments?: number
    significantMappedFragments?: number
    totalSharedLines?: number
    totalSharedTokens?: number
    
    // Plagiarism assessment
    isPlagiarism: boolean
    confidence: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
    
    // Additional info
    file1: string
    file2: string
    processingTime: number
  }
  
  interface BatchPlagiarismResult {
    results: PlagiarismResult[]
    threshold: number
    totalComparisons: number
    suspiciousPairs: number
    processingTime: number
  }
  
  interface MappedFragment {
    fragmentId: number
    confidence: number
    fragmentType: 'EXACT' | 'SIMILAR' | 'STRUCTURAL'
    
    // Position information
    file1Lines: { start: number; end: number; count: number }
    file2Lines: { start: number; end: number; count: number }
    file1TokenRange: { start: number; end: number; tokens: number }
    file2TokenRange: { start: number; end: number; tokens: number }
    
    // Content
    sharedTokens: string[]
    tokenPattern: string
    file1CodeSnippet: string
    file2CodeSnippet: string
    file1CodeWithLineNumbers: string
    file2CodeWithLineNumbers: string
    
    // Metrics
    localSimilarity: number
    sharedFingerprints: number
  }
  
  interface DetectorConfig {
    kgramSize: number
    windowSize: number
    syntacticWeight: number
    version: string
    algorithm: string
  }
  
  declare global {
    interface Window {
      electronAPI: ElectronAPI
    }
  }