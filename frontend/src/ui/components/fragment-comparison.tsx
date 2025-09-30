"use client"

import { useState } from "react"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.js"
import { Badge } from "../components/ui/badge.js"
import { ScrollArea } from "../components/ui/scroll-area.js"
import { Progress } from "../components/ui/progress.js"
import { ArrowLeft, Copy, Download, Eye, EyeOff, Maximize2, Code2, AlertTriangle, FileText, Zap } from "lucide-react"
import { cn } from "./ui/lib/utils"

interface SuspiciousFragment {
  id: string
  file1Lines: { start: number; end: number; content: string }
  file2Lines: { start: number; end: number; content: string }
  similarity: number
  type: "exact" | "structural" | "semantic"
  description: string
}

interface AnalysisResult {
  id: string
  file1: string
  file2: string
  similarity: number
  suspiciousFragments: number
  status: "high" | "medium" | "low"
  details: {
    structuralSimilarity: number
    lexicalSimilarity: number
    semanticSimilarity: number
  }
}

interface FragmentComparisonProps {
  result: AnalysisResult
  onBack: () => void
}

export default function FragmentComparison({ result, onBack }: FragmentComparisonProps) {
  const [selectedFragment, setSelectedFragment] = useState<number>(0)
  const [showLineNumbers, setShowLineNumbers] = useState(true)
  const [highlightDifferences, setHighlightDifferences] = useState(true)

  // Mock suspicious fragments data
  const suspiciousFragments: SuspiciousFragment[] = [
    {
      id: "1",
      file1Lines: {
        start: 15,
        end: 25,
        content: `procedure CalculerSomme(a, b: integer);
var
  resultat: integer;
begin
  resultat := a + b;
  writeln('La somme est: ', resultat);
end;

begin
  CalculerSomme(10, 20);
end.`,
      },
      file2Lines: {
        start: 12,
        end: 22,
        content: `procedure AdditionNombres(x, y: integer);
var
  somme: integer;
begin
  somme := x + y;
  writeln('Le résultat est: ', somme);
end;

begin
  AdditionNombres(10, 20);
end.`,
      },
      similarity: 92,
      type: "structural",
      description: "Structure de procédure identique avec noms de variables différents",
    },
    {
      id: "2",
      file1Lines: {
        start: 5,
        end: 12,
        content: `var
  i: integer;
  tableau: array[1..10] of integer;
begin
  for i := 1 to 10 do
  begin
    tableau[i] := i * 2;
  end;`,
      },
      file2Lines: {
        start: 8,
        end: 15,
        content: `var
  compteur: integer;
  liste: array[1..10] of integer;
begin
  for compteur := 1 to 10 do
  begin
    liste[compteur] := compteur * 2;
  end;`,
      },
      similarity: 88,
      type: "semantic",
      description: "Logique de boucle identique avec noms de variables différents",
    },
    {
      id: "3",
      file1Lines: {
        start: 30,
        end: 35,
        content: `if nombre > 0 then
  writeln('Nombre positif')
else
  writeln('Nombre négatif ou nul');`,
      },
      file2Lines: {
        start: 28,
        end: 33,
        content: `if valeur > 0 then
  writeln('Nombre positif')
else
  writeln('Nombre négatif ou nul');`,
      },
      similarity: 95,
      type: "exact",
      description: "Code quasi-identique avec changement de nom de variable",
    },
  ]

  const getFragmentTypeColor = (type: string) => {
    switch (type) {
      case "exact":
        return "bg-destructive/10 text-destructive border-destructive/20"
      case "structural":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
      case "semantic":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getFragmentTypeLabel = (type: string) => {
    switch (type) {
      case "exact":
        return "Exact"
      case "structural":
        return "Structurel"
      case "semantic":
        return "Sémantique"
      default:
        return type
    }
  }

  const copyFragment = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const downloadComparison = () => {
    const content = `Comparaison de plagiat - ${result.file1} vs ${result.file2}
Similarité globale: ${Math.round(result.similarity)}%
Date: ${new Date().toLocaleString("fr-FR")}

${suspiciousFragments
  .map(
    (fragment, index) => `
Fragment ${index + 1} - ${getFragmentTypeLabel(fragment.type)} (${fragment.similarity}%)
Description: ${fragment.description}

${result.file1} (lignes ${fragment.file1Lines.start}-${fragment.file1Lines.end}):
${fragment.file1Lines.content}

${result.file2} (lignes ${fragment.file2Lines.start}-${fragment.file2Lines.end}):
${fragment.file2Lines.content}

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

  const renderCodeWithLineNumbers = (content: string, startLine: number, isFile2 = false) => {
    const lines = content.split("\n")
    return (
      <div className="font-mono text-sm">
        {lines.map((line, index) => (
          <div key={index} className="flex">
            {showLineNumbers && (
              <span className="w-12 text-right pr-3 text-muted-foreground border-r border-border mr-3 select-none">
                {startLine + index}
              </span>
            )}
            <span className={cn("flex-1", highlightDifferences && isFile2 && "bg-yellow-500/10")}>{line || " "}</span>
          </div>
        ))}
      </div>
    )
  }

  const currentFragment = suspiciousFragments[selectedFragment]

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
              {result.file1} vs {result.file2} • {Math.round(result.similarity)}% de similarité
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

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{Math.round(result.similarity)}%</p>
                <p className="text-sm text-muted-foreground">Similarité globale</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{suspiciousFragments.length}</p>
                <p className="text-sm text-muted-foreground">Fragments suspects</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Code2 className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{Math.round(result.details.structuralSimilarity)}%</p>
                <p className="text-sm text-muted-foreground">Structurelle</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Maximize2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{Math.round(result.details.semanticSimilarity)}%</p>
                <p className="text-sm text-muted-foreground">Sémantique</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 flex gap-6">
        {/* Fragment List */}
        <div className="w-80 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fragments suspects</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {suspiciousFragments.map((fragment, index) => (
                  <div
                    key={fragment.id}
                    className={cn(
                      "p-4 cursor-pointer transition-colors border-l-4",
                      selectedFragment === index
                        ? "bg-accent/10 border-l-accent"
                        : "hover:bg-muted/50 border-l-transparent",
                    )}
                    onClick={() => setSelectedFragment(index)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground">Fragment {index + 1}</span>
                      <Badge className={cn("text-xs", getFragmentTypeColor(fragment.type))}>
                        {getFragmentTypeLabel(fragment.type)}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Similarité</span>
                        <span className="font-medium text-foreground">{fragment.similarity}%</span>
                      </div>

                      <Progress value={fragment.similarity} className="h-2" />

                      <p className="text-xs text-muted-foreground line-clamp-2">{fragment.description}</p>

                      <div className="text-xs text-muted-foreground">
                        Lignes {fragment.file1Lines.start}-{fragment.file1Lines.end} vs {fragment.file2Lines.start}-
                        {fragment.file2Lines.end}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Code Comparison */}
        <div className="flex-1">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  Fragment {selectedFragment + 1} - {getFragmentTypeLabel(currentFragment.type)}
                  <Badge className={cn("text-xs", getFragmentTypeColor(currentFragment.type))}>
                    {currentFragment.similarity}% similarité
                  </Badge>
                </CardTitle>

                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => copyFragment(currentFragment.file1Lines.content)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{currentFragment.description}</p>
            </CardHeader>

            <CardContent className="flex-1 p-0">
              <div className="grid grid-cols-2 h-full">
                {/* File 1 */}
                <div className="border-r border-border">
                  <div className="p-4 bg-muted/30 border-b border-border">
                    <h4 className="font-medium text-foreground">{result.file1}</h4>
                    <p className="text-sm text-muted-foreground">
                      Lignes {currentFragment.file1Lines.start}-{currentFragment.file1Lines.end}
                    </p>
                  </div>
                  <ScrollArea className="h-96 p-4">
                    {renderCodeWithLineNumbers(currentFragment.file1Lines.content, currentFragment.file1Lines.start)}
                  </ScrollArea>
                </div>

                {/* File 2 */}
                <div>
                  <div className="p-4 bg-muted/30 border-b border-border">
                    <h4 className="font-medium text-foreground">{result.file2}</h4>
                    <p className="text-sm text-muted-foreground">
                      Lignes {currentFragment.file2Lines.start}-{currentFragment.file2Lines.end}
                    </p>
                  </div>
                  <ScrollArea className="h-96 p-4">
                    {renderCodeWithLineNumbers(
                      currentFragment.file2Lines.content,
                      currentFragment.file2Lines.start,
                      true,
                    )}
                  </ScrollArea>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
