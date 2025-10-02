"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.js"
import { Badge } from "@/components/ui/badge.js"
import { ScrollArea } from "@/components/ui/scroll-area.js"
import { Progress } from "@/components/ui/progress.js"
import { ArrowLeft, Copy, Download, Eye, EyeOff, Maximize2, Code2, AlertTriangle, FileText, Zap, Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface MappedFragment {
  fragmentId: number
  confidence: number
  fragmentType: 'EXACT' | 'SIMILAR' | 'STRUCTURAL'
  file1Lines: { start: number; end: number; count: number }
  file2Lines: { start: number; end: number; count: number }
  file1TokenRange: { start: number; end: number; tokens: number }
  file2TokenRange: { start: number; end: number; tokens: number }
  sharedTokens: string[]
  tokenPattern: string
  file1CodeSnippet: string
  file2CodeSnippet: string
  file1CodeWithLineNumbers: string
  file2CodeWithLineNumbers: string
  localSimilarity: number
  sharedFingerprints: number
}

interface AnalysisResult {
  id: string
  file1: string
  file2: string
  similarity: number
  suspiciousFragments: number
  status: "high" | "medium" | "low"
  group1?: string
  group2?: string
  timestamp: Date
  processingTime?: number
  mappedFragments?: MappedFragment[]
  confidence?: string
  isPlagiarism?: boolean
  coverage1?: number
  coverage2?: number
  longestFragment?: number
}

interface FragmentComparisonProps {
  result: AnalysisResult
  onBack: () => void
}

export default function FragmentComparison({ result, onBack }: FragmentComparisonProps) {
  const [selectedFragment, setSelectedFragment] = useState<number>(0)
  const [showLineNumbers, setShowLineNumbers] = useState(true)
  const [highlightDifferences, setHighlightDifferences] = useState(true)

  const fragments = result.mappedFragments || []
  const hasFragments = fragments.length > 0

  const getFragmentTypeColor = (type: string) => {
    switch (type) {
      case "EXACT":
        return "bg-destructive/10 text-destructive border-destructive/20"
      case "SIMILAR":
        return "bg-orange-500/10 text-orange-600 border-orange-500/20"
      case "STRUCTURAL":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getFragmentTypeLabel = (type: string) => {
    switch (type) {
      case "EXACT":
        return "Exact"
      case "SIMILAR":
        return "Similaire"
      case "STRUCTURAL":
        return "Structurel"
      default:
        return type
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "high":
        return "bg-destructive/10 text-destructive border-destructive/20"
      case "medium":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
      case "low":
        return "bg-accent/10 text-accent border-accent/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "high":
        return "Élevé"
      case "medium":
        return "Moyen"
      case "low":
        return "Faible"
      default:
        return status
    }
  }

  const copyFragment = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const downloadComparison = () => {
    const content = `Comparaison de plagiat - ${result.file1} vs ${result.file2}
Similarité globale: ${result.similarity.toFixed(1)}%
Confiance: ${result.confidence || 'N/A'}
Plagiat détecté: ${result.isPlagiarism ? 'Oui' : 'Non'}
Date: ${new Date().toLocaleString("fr-FR")}

Métriques:
- Couverture ${result.file1}: ${result.coverage1?.toFixed(1) || 0}%
- Couverture ${result.file2}: ${result.coverage2?.toFixed(1) || 0}%
- Fragment le plus long: ${result.longestFragment || 0} tokens
- Fragments suspects: ${fragments.length}

${fragments
  .map(
    (fragment, index) => `
Fragment ${fragment.fragmentId} - ${getFragmentTypeLabel(fragment.fragmentType)} (${(fragment.localSimilarity * 100).toFixed(1)}%)
Confiance: ${(fragment.confidence * 100).toFixed(1)}%
Empreintes partagées: ${fragment.sharedFingerprints}

${result.file1} (lignes ${fragment.file1Lines.start}-${fragment.file1Lines.end}):
${fragment.file1CodeSnippet}

${result.file2} (lignes ${fragment.file2Lines.start}-${fragment.file2Lines.end}):
${fragment.file2CodeSnippet}

Pattern de tokens:
${fragment.tokenPattern}

${"=".repeat(80)}
`,
  )
  .join("")}`

    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `comparaison_${result.file1}_${result.file2}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const renderCodeWithLineNumbers = (codeWithNumbers: string, highlight = false) => {
    const lines = codeWithNumbers.split("\n")
    return (
      <div className="font-mono text-sm">
        {lines.map((line, index) => {
          const match = line.match(/^(\s*\d+):\s*(.*)$/)
          if (match && showLineNumbers) {
            const lineNum = match[1]
            const code = match[2]
            return (
              <div key={index} className="flex hover:bg-muted/50">
                <span className="w-12 text-right pr-3 text-muted-foreground border-r border-border mr-3 select-none">
                  {lineNum.trim()}
                </span>
                <span className={cn("flex-1", highlightDifferences && highlight && "bg-yellow-500/10")}>
                  {code || " "}
                </span>
              </div>
            )
          }
          return (
            <div key={index} className="flex hover:bg-muted/50">
              <span className={cn("flex-1 pl-3", highlightDifferences && highlight && "bg-yellow-500/10")}>
                {line || " "}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  const currentFragment = hasFragments ? fragments[selectedFragment] : null

  return (
    <div className="h-full flex flex-col p-6 gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Comparaison détaillée</h2>
            <p className="text-muted-foreground">
              {result.file1} vs {result.file2} • {result.similarity.toFixed(1)}% de similarité
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowLineNumbers(!showLineNumbers)}>
            {showLineNumbers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            Numéros de ligne
          </Button>
          <Button variant="outline" size="sm" onClick={() => setHighlightDifferences(!highlightDifferences)}>
            <Zap className="h-4 w-4" />
            Surligner
          </Button>
          <Button variant="outline" size="sm" onClick={downloadComparison}>
            <Download className="h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>



      {!hasFragments ? (
        <Card className="flex-1 flex items-center justify-center">
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Aucun fragment détecté</h3>
            <p className="text-muted-foreground">
              Cette comparaison n'a pas de fragments mappés à afficher.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex-1 flex gap-6 overflow-hidden">
          {/* Fragment List */}
          <div className="w-80 space-y-4 overflow-hidden flex flex-col">
            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg">Fragments suspects ({fragments.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="space-y-1 p-2">
                    {fragments.map((fragment, index) => (
                      <div
                        key={fragment.fragmentId}
                        className={cn(
                          "p-4 cursor-pointer transition-colors border-l-4 rounded",
                          selectedFragment === index
                            ? "bg-accent/10 border-l-accent"
                            : "hover:bg-muted/50 border-l-transparent",
                        )}
                        onClick={() => setSelectedFragment(index)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-foreground">Fragment {fragment.fragmentId}</span>
                          <Badge className={cn("text-xs", getFragmentTypeColor(fragment.fragmentType))}>
                            {getFragmentTypeLabel(fragment.fragmentType)}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Similarité locale</span>
                            <span className="font-medium text-foreground">
                              {(fragment.localSimilarity * 100).toFixed(1)}%
                            </span>
                          </div>

                          <Progress value={fragment.localSimilarity * 100} className="h-2" />

                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Confiance</span>
                            <span className="font-medium">{(fragment.confidence * 100).toFixed(1)}%</span>
                          </div>

                          <div className="text-xs text-muted-foreground">
                            <div>
                              Lignes {fragment.file1Lines.start}-{fragment.file1Lines.end} ({fragment.file1Lines.count})
                            </div>
                            <div>
                              vs {fragment.file2Lines.start}-{fragment.file2Lines.end} ({fragment.file2Lines.count})
                            </div>
                          </div>

                          <div className="text-xs text-muted-foreground">
                            {fragment.sharedFingerprints} empreintes • {fragment.sharedTokens.length} tokens
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Code Comparison */}
          <div className="flex-1 overflow-hidden">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    Fragment {currentFragment?.fragmentId} - {getFragmentTypeLabel(currentFragment?.fragmentType || '')}
                    <Badge className={cn("text-xs", getFragmentTypeColor(currentFragment?.fragmentType || ''))}>
                      {(currentFragment ? currentFragment.localSimilarity * 100 : 0).toFixed(1)}% similarité
                    </Badge>
                  </CardTitle>

                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => currentFragment && copyFragment(currentFragment.file1CodeSnippet)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {currentFragment && (
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Confiance: {(currentFragment.confidence * 100).toFixed(1)}% • Empreintes: {currentFragment.sharedFingerprints}</p>
                    <p className="font-mono text-xs bg-muted/50 p-2 rounded">Pattern: {currentFragment.tokenPattern}</p>
                  </div>
                )}
              </CardHeader>

              <CardContent className="flex-1 p-0 overflow-hidden">
                <div className="grid grid-cols-2 h-full">
                  {/* File 1 */}
                  <div className="border-r border-border flex flex-col">
                    <div className="p-4 bg-muted/30 border-b border-border">
                      <h4 className="font-medium text-foreground">{result.file1}</h4>
                      {currentFragment && (
                        <p className="text-sm text-muted-foreground">
                          Lignes {currentFragment.file1Lines.start}-{currentFragment.file1Lines.end} ({currentFragment.file1Lines.count} lignes)
                        </p>
                      )}
                    </div>
                    <ScrollArea className="flex-1 p-4">
                      {currentFragment && renderCodeWithLineNumbers(currentFragment.file1CodeWithLineNumbers, false)}
                    </ScrollArea>
                  </div>

                  {/* File 2 */}
                  <div className="flex flex-col">
                    <div className="p-4 bg-muted/30 border-b border-border">
                      <h4 className="font-medium text-foreground">{result.file2}</h4>
                      {currentFragment && (
                        <p className="text-sm text-muted-foreground">
                          Lignes {currentFragment.file2Lines.start}-{currentFragment.file2Lines.end} ({currentFragment.file2Lines.count} lignes)
                        </p>
                      )}
                    </div>
                    <ScrollArea className="flex-1 p-4">
                      {currentFragment && renderCodeWithLineNumbers(currentFragment.file2CodeWithLineNumbers, true)}
                    </ScrollArea>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}