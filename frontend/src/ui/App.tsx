"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, FileText, BarChart3, Search, Users, AlertCircle } from "lucide-react"
import AnalysisDashboard from "./components/analysis-dashboard"
import ResultsViewer from "./components/results-viewer"
import FragmentComparison from "./components/fragment-comparison"
import SettingsPanel from "./components/settings-panel"

interface PascalFile {
  id: string
  name: string
  size: number
  content: string
  path?: string
  group?: string
  members?: string[]
  status: "pending" | "analyzing" | "completed" | "error"
  lastModified: Date
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
  mappedFragments?: any[]
  confidence?: string
  isPlagiarism?: boolean
  coverage1?: number
  coverage2?: number
  longestFragment?: number
}

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([])
  const [selectedFiles, setSelectedFiles] = useState<PascalFile[]>([])
  const [selectedResult, setSelectedResult] = useState<AnalysisResult | null>(null)
  const [showComparison, setShowComparison] = useState(false)

  const handleAnalysisComplete = (results: AnalysisResult[]) => {
    setAnalysisResults(results)
    setActiveTab("results")
  }

  const handleViewDetails = (result: AnalysisResult) => {
    setSelectedResult(result)
    setShowComparison(true)
    setActiveTab("comparison")
  }

  const handleBackFromComparison = () => {
    setShowComparison(false)
    setSelectedResult(null)
    setActiveTab("results")
  }

  // Stats for the sidebar
  const highRiskCount = analysisResults.filter((r) => r.status === "high").length
  const mediumRiskCount = analysisResults.filter((r) => r.status === "medium").length
  const lowRiskCount = analysisResults.filter((r) => r.status === "low").length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
                <Search className="h-4 w-4 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-semibold text-foreground">Détecteur de Plagiat Pascal</h1>
            </div>
            
            {/* Status indicators */}
            {selectedFiles.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">{selectedFiles.length} fichiers</span>
                {analysisResults.length > 0 && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">{analysisResults.length} analyses</span>
                    {highRiskCount > 0 && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <div className="flex items-center gap-1">
                          <AlertCircle className="h-4 w-4 text-destructive" />
                          <span className="text-destructive font-medium">{highRiskCount} risque élevé</span>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {window.electronAPI && (
              <div className="text-xs text-accent bg-accent/10 px-2 py-1 rounded">
                Electron Mode
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Settings className="h-4 w-4" />
              Paramètres
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="border-b border-border bg-card px-6">
              <TabsList className="grid w-full max-w-2xl grid-cols-5 bg-muted">
                <TabsTrigger value="dashboard" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Tableau de bord
                </TabsTrigger>
                <TabsTrigger value="results" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Résultats
                  {analysisResults.length > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full ml-1">
                      {analysisResults.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="comparison" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Comparaison
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Statistiques
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Configuration
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="dashboard" className="h-full m-0">
                <AnalysisDashboard 
                  selectedFiles={selectedFiles} 
                  onFilesChange={setSelectedFiles}
                  onAnalysisComplete={handleAnalysisComplete}
                />
              </TabsContent>

              <TabsContent value="results" className="h-full m-0">
                <ResultsViewer results={analysisResults} onViewDetails={handleViewDetails} />
              </TabsContent>

              <TabsContent value="comparison" className="h-full m-0">
                {selectedResult ? (
                  <FragmentComparison result={selectedResult} onBack={handleBackFromComparison} />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Sélectionnez un résultat d'analyse pour voir la comparaison détaillée</p>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="analytics" className="h-full m-0">
                <div className="p-6">
                  <h2 className="text-2xl font-bold mb-6">Statistiques d'analyse</h2>
                  
                  {analysisResults.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucune statistique disponible</p>
                      <p className="text-sm">Effectuez des analyses pour voir les statistiques</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-card border rounded-lg p-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-destructive/10">
                            <AlertCircle className="h-6 w-6 text-destructive" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-foreground">{highRiskCount}</p>
                            <p className="text-sm text-muted-foreground">Risque élevé</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-card border rounded-lg p-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-yellow-500/10">
                            <AlertCircle className="h-6 w-6 text-yellow-600" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-foreground">{mediumRiskCount}</p>
                            <p className="text-sm text-muted-foreground">Risque moyen</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-card border rounded-lg p-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-accent/10">
                            <FileText className="h-6 w-6 text-accent" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-foreground">{lowRiskCount}</p>
                            <p className="text-sm text-muted-foreground">Risque faible</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-card border rounded-lg p-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <BarChart3 className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-foreground">
                              {analysisResults.length > 0 
                                ? (analysisResults.reduce((sum, r) => sum + r.similarity, 0) / analysisResults.length).toFixed(1)
                                : 0
                              }%
                            </p>
                            <p className="text-sm text-muted-foreground">Similarité moyenne</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="settings" className="h-full m-0">
                <SettingsPanel />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Settings Sidebar */}
        {settingsOpen && (
          <div className="w-80 border-l border-border bg-card">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Configuration Rapide</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSettingsOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ×
                </Button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-3">
                <div className="text-sm">
                  <p className="font-medium text-foreground mb-2">Fichiers chargés</p>
                  <p className="text-muted-foreground">
                    {selectedFiles.length} fichier{selectedFiles.length > 1 ? "s" : ""}
                  </p>
                </div>

                <div className="text-sm">
                  <p className="font-medium text-foreground mb-2">Analyses effectuées</p>
                  <p className="text-muted-foreground">
                    {analysisResults.length} comparaison{analysisResults.length > 1 ? "s" : ""}
                  </p>
                </div>

                {analysisResults.length > 0 && (
                  <div className="text-sm">
                    <p className="font-medium text-foreground mb-2">Résultats à risque</p>
                    <div className="space-y-1">
                      <p className="text-destructive">
                        {highRiskCount} élevé
                      </p>
                      <p className="text-yellow-600">
                        {mediumRiskCount} moyen
                      </p>
                      <p className="text-accent">
                        {lowRiskCount} faible
                      </p>
                    </div>
                  </div>
                )}

                {/* Environment Info */}
                <div className="text-sm pt-4 border-t border-border">
                  <p className="font-medium text-foreground mb-2">Environnement</p>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">
                      Mode: {window.electronAPI ? "Electron" : "Web"}
                    </p>
                    <p className="text-muted-foreground">
                      API: {window.electronAPI ? "Disponible" : "Non disponible"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-transparent"
                  onClick={() => {
                    setActiveTab("settings")
                    setSettingsOpen(false)
                  }}
                >
                  Paramètres complets
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}