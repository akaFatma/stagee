"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.js"
import { Badge } from "@/components/ui/badge.js"
import { Input } from "@/components/ui/input.js"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.js"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.js"
import { Progress } from "@/components/ui/progress.js"
import {
  Search,
  Filter,
  Download,
  Eye,
  AlertTriangle,
  TrendingUp,
  FileText,
  Users,
  ArrowUpDown,
  BarChart3,
  Clock,
  Zap,
  Code
} from "lucide-react"
import { cn } from "@/lib/utils"

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
  group1?: string
  group2?: string
  timestamp: Date
  processingTime?: number
  mappedFragments?: any[]
  // New fields from actual detection
  confidence?: string
  isPlagiarism?: boolean
  coverage1?: number
  coverage2?: number
  longestFragment?: number
}

interface ResultsViewerProps {
  results: AnalysisResult[]
  onViewDetails: (result: AnalysisResult) => void
}

export default function ResultsViewer({ results, onViewDetails }: ResultsViewerProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("similarity")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [selectedView, setSelectedView] = useState<"cards" | "table">("cards")

  // Filter and sort results
  const filteredResults = results
    .filter((result) => {
      const matchesSearch =
        searchTerm === "" ||
        result.file1.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.file2.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.group1?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.group2?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === "all" || result.status === statusFilter

      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      let aValue: number
      let bValue: number

      switch (sortBy) {
        case "similarity":
          aValue = a.similarity
          bValue = b.similarity
          break
        case "fragments":
          aValue = a.suspiciousFragments
          bValue = b.suspiciousFragments
          break
        case "timestamp":
          aValue = a.timestamp.getTime()
          bValue = b.timestamp.getTime()
          break
        case "processingTime":
          aValue = a.processingTime || 0
          bValue = b.processingTime || 0
          break
        default:
          aValue = a.similarity
          bValue = b.similarity
      }

      return sortOrder === "desc" ? bValue - aValue : aValue - bValue
    })

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

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "VERY_HIGH":
        return "text-destructive"
      case "HIGH":
        return "text-orange-600"
      case "MEDIUM":
        return "text-yellow-600"
      case "LOW":
        return "text-muted-foreground"
      default:
        return "text-muted-foreground"
    }
  }

  const exportResults = () => {
    const csvContent = [
      [
        "Fichier 1",
        "Fichier 2",
        "Groupe 1",
        "Groupe 2",
        "Similarité (%)",
        "Fragments suspects",
        "Statut",
        "Plagiat détecté",
        "Confiance",
        "Similarité structurelle",
        "Similarité lexicale",
        "Similarité sémantique",
        "Coverage 1",
        "Coverage 2",
        "Fragment le plus long",
        "Temps de traitement (ms)",
        "Horodatage"
      ],
      ...filteredResults.map((result) => [
        result.file1,
        result.file2,
        result.group1 || '',
        result.group2 || '',
        result.similarity.toFixed(1),
        result.suspiciousFragments.toString(),
        getStatusLabel(result.status),
        result.isPlagiarism ? 'Oui' : 'Non',
        result.confidence || '',
        result.details.structuralSimilarity.toFixed(1),
        result.details.lexicalSimilarity.toFixed(1),
        result.details.semanticSimilarity.toFixed(1),
        result.coverage1?.toFixed(1) || '',
        result.coverage2?.toFixed(1) || '',
        result.longestFragment?.toString() || '',
        result.processingTime?.toFixed(0) || '',
        result.timestamp.toISOString()
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `resultats_plagiat_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const highRiskCount = results.filter((r) => r.status === "high").length
  const mediumRiskCount = results.filter((r) => r.status === "medium").length
  const lowRiskCount = results.filter((r) => r.status === "low").length
  const averageSimilarity = results.length > 0 ? results.reduce((sum, r) => sum + r.similarity, 0) / results.length : 0
  const plagiarismCount = results.filter((r) => r.isPlagiarism).length

  return (
    <div className="h-full flex flex-col p-6 gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Résultats d'analyse</h2>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
            <span>{results.length} comparaison{results.length > 1 ? "s" : ""} effectuée{results.length > 1 ? "s" : ""}</span>
            {plagiarismCount > 0 && (
              <>
                <span>•</span>
                <span className="text-destructive font-medium">{plagiarismCount} plagiat{plagiarismCount > 1 ? "s" : ""} détecté{plagiarismCount > 1 ? "s" : ""}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedView(selectedView === "cards" ? "table" : "cards")}
          >
            {selectedView === "cards" ? "Vue tableau" : "Vue cartes"}
          </Button>
          <Button onClick={exportResults} disabled={results.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
        </div>
      </div>

      <Tabs defaultValue="results" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="results" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Résultats détaillés
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Statistiques
          </TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="flex-1 flex flex-col gap-6 mt-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4 items-center flex-wrap">
                <div className="flex-1 min-w-64 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par nom de fichier ou groupe..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="high">Risque élevé</SelectItem>
                    <SelectItem value="medium">Risque moyen</SelectItem>
                    <SelectItem value="low">Risque faible</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="similarity">Similarité</SelectItem>
                    <SelectItem value="fragments">Fragments suspects</SelectItem>
                    <SelectItem value="timestamp">Date d'analyse</SelectItem>
                    <SelectItem value="processingTime">Temps de traitement</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                >
                  {sortOrder === "desc" ? "↓" : "↑"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Display */}
          <div className="flex-1 overflow-auto">
            {filteredResults.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun résultat trouvé</p>
                <p className="text-sm">Ajustez vos filtres ou lancez une nouvelle analyse</p>
              </div>
            ) : selectedView === "cards" ? (
              <div className="space-y-4">
                {filteredResults.map((result) => (
                  <Card key={result.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-foreground">
                              {result.file1} vs {result.file2}
                            </h3>
                            <Badge className={cn("capitalize", getStatusColor(result.status))}>
                              {getStatusLabel(result.status)}
                            </Badge>
                            {result.isPlagiarism && (
                              <Badge variant="destructive">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Plagiat détecté
                              </Badge>
                            )}
                          </div>

                          {(result.group1 || result.group2) && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                              <Users className="h-4 w-4" />
                              {result.group1 || 'N/A'} vs {result.group2 || 'N/A'}
                            </div>
                          )}

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Structurelle: </span>
                              <span className="font-medium">{result.details.structuralSimilarity.toFixed(1)}%</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Lexicale: </span>
                              <span className="font-medium">{result.details.lexicalSimilarity.toFixed(1)}%</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Sémantique: </span>
                              <span className="font-medium">{result.details.semanticSimilarity.toFixed(1)}%</span>
                            </div>
                            {result.confidence && (
                              <div>
                                <span className="text-muted-foreground">Confiance: </span>
                                <span className={cn("font-medium", getConfidenceColor(result.confidence))}>
                                  {result.confidence.replace('_', ' ')}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="text-sm text-muted-foreground mt-2">
                            <div className="flex items-center gap-4 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {result.timestamp.toLocaleString("fr-FR")}
                              </span>
                              {result.processingTime && (
                                <span className="flex items-center gap-1">
                                  <Zap className="h-3 w-3" />
                                  {result.processingTime.toFixed(0)}ms
                                </span>
                              )}
                              {result.mappedFragments && result.mappedFragments.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <Code className="h-3 w-3" />
                                  {result.mappedFragments.length} fragments mappés
                                </span>
                              )}
                              {result.longestFragment && (
                                <span className="flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  Fragment max: {result.longestFragment} tokens
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-2xl font-bold text-foreground">{result.similarity.toFixed(1)}%</div>
                            <div className="text-sm text-muted-foreground">
                              {result.suspiciousFragments} fragment{result.suspiciousFragments > 1 ? "s" : ""}
                            </div>
                            {result.coverage1 !== undefined && result.coverage2 !== undefined && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Coverage: {result.coverage1.toFixed(0)}% / {result.coverage2.toFixed(0)}%
                              </div>
                            )}
                          </div>

                          <Button variant="outline" size="sm" onClick={() => onViewDetails(result)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Détails
                          </Button>
                        </div>
                      </div>

                      {/* Progress bars for similarity breakdown */}
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-muted-foreground">Structurelle</span>
                            <span className="font-medium">{Math.round(result.details.structuralSimilarity)}%</span>
                          </div>
                          <Progress value={result.details.structuralSimilarity} className="h-2" />
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-muted-foreground">Lexicale</span>
                            <span className="font-medium">{Math.round(result.details.lexicalSimilarity)}%</span>
                          </div>
                          <Progress value={result.details.lexicalSimilarity} className="h-2" />
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-muted-foreground">Sémantique</span>
                            <span className="font-medium">{Math.round(result.details.semanticSimilarity)}%</span>
                          </div>
                          <Progress value={result.details.semanticSimilarity} className="h-2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              // Table view
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-4 font-medium">Comparaison</th>
                          <th className="text-left p-4 font-medium">Groupes</th>
                          <th className="text-left p-4 font-medium">Similarité</th>
                          <th className="text-left p-4 font-medium">Fragments</th>
                          <th className="text-left p-4 font-medium">Statut</th>
                          <th className="text-left p-4 font-medium">Confiance</th>
                          <th className="text-left p-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredResults.map((result) => (
                          <tr key={result.id} className="border-b border-border hover:bg-muted/20">
                            <td className="p-4">
                              <div>
                                <div className="font-medium">{result.file1}</div>
                                <div className="text-sm text-muted-foreground">vs {result.file2}</div>
                              </div>
                            </td>
                            <td className="p-4 text-sm text-muted-foreground">
                              {result.group1 || 'N/A'} vs {result.group2 || 'N/A'}
                            </td>
                            <td className="p-4">
                              <div className="font-bold text-lg">{result.similarity.toFixed(1)}%</div>
                              {result.isPlagiarism && (
                                <Badge variant="destructive" className="mt-1">
                                  Plagiat
                                </Badge>
                              )}
                            </td>
                            <td className="p-4">
                              <div className="font-medium">{result.suspiciousFragments}</div>
                              {result.longestFragment && (
                                <div className="text-xs text-muted-foreground">
                                  Max: {result.longestFragment} tokens
                                </div>
                              )}
                            </td>
                            <td className="p-4">
                              <Badge className={getStatusColor(result.status)}>
                                {getStatusLabel(result.status)}
                              </Badge>
                            </td>
                            <td className="p-4">
                              {result.confidence && (
                                <span className={cn("text-sm font-medium", getConfidenceColor(result.confidence))}>
                                  {result.confidence.replace('_', ' ')}
                                </span>
                              )}
                            </td>
                            <td className="p-4">
                              <Button variant="outline" size="sm" onClick={() => onViewDetails(result)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Détails
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="statistics" className="flex-1 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{highRiskCount}</p>
                    <p className="text-sm text-muted-foreground">Risque élevé</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <TrendingUp className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{mediumRiskCount}</p>
                    <p className="text-sm text-muted-foreground">Risque moyen</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <FileText className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{lowRiskCount}</p>
                    <p className="text-sm text-muted-foreground">Risque faible</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{Math.round(averageSimilarity)}%</p>
                    <p className="text-sm text-muted-foreground">Similarité moyenne</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Distribution des résultats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-destructive">Risque élevé ≥80%</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div
                          className="bg-destructive h-2 rounded-full"
                          style={{ width: `${results.length > 0 ? (highRiskCount / results.length) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {results.length > 0 ? Math.round((highRiskCount / results.length) * 100) : 0}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-yellow-600">Risque moyen 60-80%</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: `${results.length > 0 ? (mediumRiskCount / results.length) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {results.length > 0 ? Math.round((mediumRiskCount / results.length) * 100) : 0}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-accent">Risque faible &lt;60%</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div
                          className="bg-accent h-2 rounded-full"
                          style={{ width: `${results.length > 0 ? (lowRiskCount / results.length) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {results.length > 0 ? Math.round((lowRiskCount / results.length) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Statistiques de performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Temps moyen de traitement</span>
                    <span className="font-bold">
                      {results.length > 0 && results.some(r => r.processingTime) ? 
                        Math.round(results.filter(r => r.processingTime).reduce((sum, r) => sum + (r.processingTime || 0), 0) / results.filter(r => r.processingTime).length) + 'ms' : 
                        'N/A'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Plagiats confirmés</span>
                    <span className="font-bold text-destructive">
                      {plagiarismCount} / {results.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Fragments mappés (total)</span>
                    <span className="font-bold">
                      {results.reduce((sum, r) => sum + (r.mappedFragments?.length || 0), 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Fragment le plus long</span>
                    <span className="font-bold">
                      {results.filter(r => r.longestFragment).length > 0 ?
                        Math.max(...results.filter(r => r.longestFragment).map(r => r.longestFragment!)) + ' tokens' :
                        'N/A'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Analyses effectuées</span>
                    <span className="font-bold">{results.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}