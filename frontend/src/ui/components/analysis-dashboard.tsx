"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.js"
import { Badge } from "@/components/ui/badge.js"
import { Progress } from "@/components/ui/progress.js"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.js"
import { Upload, FileText, Trash2, Users, FolderOpen, AlertCircle, CheckCircle2, Clock, Play, Pause, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

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
}

interface AnalysisDashboardProps {
  selectedFiles: PascalFile[]
  onFilesChange: (files: PascalFile[]) => void
  onAnalysisComplete?: (results: AnalysisResult[]) => void
}

// Global declaration for Electron API
declare global {
  interface Window {
    electronAPI: {
      openFiles: () => Promise<{ success: boolean; files: any[] }>
      detectPlagiarism: (file1: any, file2: any) => Promise<{ success: boolean; result?: any; error?: string }>
      detectBatchPlagiarism: (files: any[], options?: any) => Promise<{ success: boolean; result?: any; error?: string }>
      getDetectorConfig: () => Promise<{ success: boolean; config?: any; error?: string }>
      isElectron: boolean
    }
  }
}

export default function AnalysisDashboard({ selectedFiles, onFilesChange, onAnalysisComplete }: AnalysisDashboardProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([])
  const [analysisLog, setAnalysisLog] = useState<string[]>([])

  // Parse group information from filename (format: membre1_membre2_G[numéro])
  const parseGroupInfo = (filename: string) => {
    const match = filename.match(/^(.+)_G(\d+)\.pas$/i)
    if (match) {
      const membersStr = match[1]
      const groupNumber = match[2]
      const members = membersStr.split("_").filter((m) => m.length > 0)
      return {
        group: `Groupe ${groupNumber}`,
        members,
      }
    }
    return null
  }

  const addToLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setAnalysisLog(prev => [...prev, `[${timestamp}] ${message}`])
  }

  // Handle Electron file selection
  const handleElectronFileSelect = async () => {
    try {
      if (!window.electronAPI) {
        addToLog('❌ Cette fonction nécessite Electron')
        return
      }

      addToLog('📂 Ouverture du sélecteur de fichiers...')
      const result = await window.electronAPI.openFiles()
      
      if (result.success && result.files.length > 0) {
        setUploadProgress(0)
        const newFiles: PascalFile[] = []

        for (let i = 0; i < result.files.length; i++) {
          const file = result.files[i]
          const groupInfo = parseGroupInfo(file.name)

          const pascalFile: PascalFile = {
            id: `${file.name}-${Date.now()}-${i}`,
            name: file.name,
            size: file.size,
            content: file.content,
            path: file.path,
            group: groupInfo?.group,
            members: groupInfo?.members,
            status: "pending",
            lastModified: new Date(file.lastModified),
          }

          newFiles.push(pascalFile)
          setUploadProgress(((i + 1) / result.files.length) * 100)
        }

        onFilesChange([...selectedFiles, ...newFiles])
        setUploadProgress(0)
        
        addToLog(`✅ Chargé ${newFiles.length} fichiers avec succès`)
      } else {
        addToLog('ℹ️ Aucun fichier sélectionné')
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue'
      addToLog(`❌ Erreur lors de la sélection: ${errorMsg}`)
    }
  }

  // Handle web file input
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      handleFiles(files)
    }
  }

  const handleFiles = async (files: File[]) => {
    const pascalFiles = files.filter((file) => file.name.endsWith(".pas"))

    if (pascalFiles.length === 0) {
      addToLog("❌ Veuillez sélectionner uniquement des fichiers .pas")
      return
    }

    setUploadProgress(0)
    const newFiles: PascalFile[] = []

    for (let i = 0; i < pascalFiles.length; i++) {
      const file = pascalFiles[i]
      const content = await file.text()
      const groupInfo = parseGroupInfo(file.name)

      const pascalFile: PascalFile = {
        id: `${file.name}-${Date.now()}-${i}`,
        name: file.name,
        size: file.size,
        content,
        group: groupInfo?.group,
        members: groupInfo?.members,
        status: "pending",
        lastModified: new Date(file.lastModified),
      }

      newFiles.push(pascalFile)
      setUploadProgress(((i + 1) / pascalFiles.length) * 100)
    }

    onFilesChange([...selectedFiles, ...newFiles])
    setUploadProgress(0)
    addToLog(`✅ Chargé ${newFiles.length} fichiers via navigateur`)
  }

  const removeFile = (fileId: string) => {
    onFilesChange(selectedFiles.filter((f) => f.id !== fileId))
    addToLog(`🗑️ Fichier supprimé`)
  }

  // Start plagiarism analysis
  const startAnalysis = async () => {
    if (selectedFiles.length < 2) {
      addToLog("❌ Au moins 2 fichiers sont nécessaires pour l'analyse")
      return
    }

    if (!window.electronAPI) {
      addToLog("❌ L'analyse nécessite Electron")
      return
    }

    setIsAnalyzing(true)
    setAnalysisProgress(0)
    setAnalysisResults([])
    addToLog(`🚀 Démarrage de l'analyse de ${selectedFiles.length} fichiers`)

    try {
      // Update file statuses
      const updatedFiles = selectedFiles.map(f => ({ ...f, status: "analyzing" as const }))
      onFilesChange(updatedFiles)

      // Convert to the format expected by the detector
      const filesForDetection = selectedFiles.map(f => ({
        name: f.name,
        content: f.content,
        metadata: {
          author: f.members?.join(', '),
          timestamp: f.lastModified,
          language: 'pascal'
        }
      }))

      // Perform batch analysis
      const batchResult = await window.electronAPI.detectBatchPlagiarism(filesForDetection)

      if (batchResult.success && batchResult.result) {
        const results = batchResult.result.results.map((r: any, index: number) => {
          const file1Info = selectedFiles.find(f => f.name === r.file1)
          const file2Info = selectedFiles.find(f => f.name === r.file2)
          
          // Determine status based on similarity
          let status: "high" | "medium" | "low" = "low"
          if (r.overallSimilarity >= 0.8) status = "high"
          else if (r.overallSimilarity >= 0.6) status = "medium"

          return {
            id: `analysis-${index}`,
            file1: r.file1,
            file2: r.file2,
            similarity: r.overallSimilarity * 100,
            suspiciousFragments: r.mappedFragments?.length || r.sharedFragments || 0,
            status,
            details: {
              structuralSimilarity: r.syntacticSimilarity * 100,
              lexicalSimilarity: (r.coverage1 + r.coverage2) * 50, // approximation
              semanticSimilarity: r.overallSimilarity * 100
            },
            group1: file1Info?.group,
            group2: file2Info?.group,
            timestamp: new Date(),
            processingTime: r.processingTime,
            mappedFragments: r.mappedFragments || []
          }
        })

        setAnalysisResults(results)
        
        // Update file statuses to completed
        const completedFiles = selectedFiles.map(f => ({ ...f, status: "completed" as const }))
        onFilesChange(completedFiles)

        addToLog(`✅ Analyse terminée: ${results.length} comparaisons effectuées`)
        addToLog(`⚠️ ${results.filter((r:any) => r.status === 'high').length} risques élevés détectés`)
        
        // Notify parent component
        if (onAnalysisComplete) {
          onAnalysisComplete(results)
        }
        
      } else {
        throw new Error(batchResult.error || 'Erreur inconnue lors de l\'analyse')
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue'
      addToLog(`❌ Erreur d'analyse: ${errorMsg}`)
      
      // Update file statuses to error
      const errorFiles = selectedFiles.map(f => ({ ...f, status: "error" as const }))
      onFilesChange(errorFiles)
    } finally {
      setIsAnalyzing(false)
      setAnalysisProgress(100)
    }
  }

  const getStatusIcon = (status: PascalFile["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-muted-foreground" />
      case "analyzing":
        return <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-accent" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />
    }
  }

  const getStatusColor = (status: PascalFile["status"]) => {
    switch (status) {
      case "pending":
        return "bg-muted text-muted-foreground"
      case "analyzing":
        return "bg-primary/10 text-primary"
      case "completed":
        return "bg-accent/10 text-accent"
      case "error":
        return "bg-destructive/10 text-destructive"
    }
  }

  const groupedFiles = selectedFiles.reduce(
    (acc, file) => {
      const group = file.group || "Sans groupe"
      if (!acc[group]) acc[group] = []
      acc[group].push(file)
      return acc
    },
    {} as Record<string, PascalFile[]>,
  )

  return (
    <div className="h-full flex flex-col p-6 gap-6">
      <Tabs defaultValue="files" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="files">Gestion des fichiers</TabsTrigger>
          <TabsTrigger value="analysis">Analyse</TabsTrigger>
          <TabsTrigger value="results">Résultats</TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="flex-1 flex flex-col gap-6 mt-6">
          {/* Upload Area */}
          <Card className="border-dashed border-2 border-border">
            <CardContent className="p-8">
              <div
                className={cn(
                  "flex flex-col items-center justify-center gap-4 text-center transition-colors",
                  dragActive && "bg-accent/5",
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="p-4 rounded-full bg-muted">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Télécharger des fichiers Pascal</h3>
                  <p className="text-muted-foreground mb-4">
                    Glissez-déposez vos fichiers .pas ici ou cliquez pour sélectionner
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">Format attendu: membre1_membre2_G[numéro].pas</p>
                  
                  <div className="flex gap-2 justify-center">
                    {window.electronAPI && (
                      <Button onClick={handleElectronFileSelect}>
                        <FolderOpen className="h-4 w-4 mr-2" />
                        Parcourir les fichiers
                      </Button>
                    )}
                    
                    <input
                      type="file"
                      multiple
                      accept=".pas"
                      onChange={handleFileInput}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button asChild variant={window.electronAPI ? "outline" : "default"}>
                      <label htmlFor="file-upload" className="cursor-pointer">
                        {window.electronAPI ? "Sélectionner (Web)" : "Sélectionner des fichiers"}
                      </label>
                    </Button>
                  </div>
                </div>
              </div>

              {uploadProgress > 0 && (
                <div className="mt-4">
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    Téléchargement en cours... {Math.round(uploadProgress)}%
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Files List */}
          {selectedFiles.length > 0 && (
            <div className="flex-1 overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Fichiers chargés ({selectedFiles.length})</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onFilesChange([])}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Tout supprimer
                </Button>
              </div>

              <div className="space-y-4">
                {Object.entries(groupedFiles).map(([groupName, files]) => (
                  <Card key={groupName}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Users className="h-4 w-4" />
                        {groupName}
                        <Badge variant="secondary" className="ml-auto">
                          {files.length} fichier{files.length > 1 ? "s" : ""}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {files.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-foreground truncate">{file.name}</p>
                              <Badge variant="outline" className={cn("text-xs", getStatusColor(file.status))}>
                                {getStatusIcon(file.status)}
                                <span className="ml-1">
                                  {file.status === "pending" && "En attente"}
                                  {file.status === "analyzing" && "Analyse..."}
                                  {file.status === "completed" && "Terminé"}
                                  {file.status === "error" && "Erreur"}
                                </span>
                              </Badge>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{(file.size / 1024).toFixed(1)} KB</span>
                              {file.members && <span>Membres: {file.members.join(", ")}</span>}
                              <span>Modifié: {file.lastModified.toLocaleDateString("fr-FR")}</span>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(file.id)}
                            className="text-muted-foreground hover:text-destructive flex-shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="flex-1 flex flex-col gap-6 mt-6">
          {/* Analysis Control Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Contrôle d'analyse
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Fichiers sélectionnés: {selectedFiles.length}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedFiles.length >= 2 ? 
                      `${selectedFiles.length * (selectedFiles.length - 1) / 2} comparaisons à effectuer` : 
                      'Au moins 2 fichiers requis'
                    }
                  </p>
                </div>
                <Button 
                  onClick={startAnalysis} 
                  disabled={selectedFiles.length < 2 || isAnalyzing}
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Analyse en cours...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Démarrer l'analyse
                    </>
                  )}
                </Button>
              </div>

              {isAnalyzing && (
                <div>
                  <Progress value={analysisProgress} className="w-full" />
                  <p className="text-sm text-muted-foreground mt-2">
                    Analyse en cours... {Math.round(analysisProgress)}%
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analysis Log */}
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Journal d'analyse</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/20 p-4 rounded-lg h-64 overflow-y-auto font-mono text-sm">
                {analysisLog.length === 0 ? (
                  <p className="text-muted-foreground">Aucune activité d'analyse...</p>
                ) : (
                  analysisLog.map((log, index) => (
                    <div key={index} className="mb-1">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="flex-1 mt-6">
          {analysisResults.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun résultat d'analyse</p>
                <p className="text-sm">Démarrez une analyse pour voir les résultats ici</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Résultats d'analyse ({analysisResults.length})</h3>
                <div className="flex gap-2">
                  <Badge variant="destructive">
                    {analysisResults.filter(r => r.status === 'high').length} Élevé
                  </Badge>
                  <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                    {analysisResults.filter(r => r.status === 'medium').length} Moyen
                  </Badge>
                  <Badge variant="secondary">
                    {analysisResults.filter(r => r.status === 'low').length} Faible
                  </Badge>
                </div>
              </div>

              <div className="grid gap-4">
                {analysisResults.map((result) => (
                  <Card key={result.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium">{result.file1} vs {result.file2}</h4>
                            <Badge 
                              variant={result.status === 'high' ? 'destructive' : 
                                     result.status === 'medium' ? 'outline' : 'secondary'}
                              className={result.status === 'medium' ? 'border-yellow-500 text-yellow-600' : ''}
                            >
                              {result.status === 'high' ? 'Risque élevé' :
                               result.status === 'medium' ? 'Risque moyen' : 'Risque faible'}
                            </Badge>
                          </div>
                          {(result.group1 || result.group2) && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {result.group1} vs {result.group2}
                            </p>
                          )}
                          <div className="grid grid-cols-3 gap-4 text-sm">
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
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-foreground">
                            {result.similarity.toFixed(1)}%
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {result.suspiciousFragments} fragment{result.suspiciousFragments > 1 ? 's' : ''}
                          </div>
                          {result.processingTime && (
                            <div className="text-xs text-muted-foreground">
                              {result.processingTime.toFixed(0)}ms
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedFiles.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun fichier chargé</p>
            <p className="text-sm">Commencez par télécharger des fichiers Pascal</p>
            
            <p className="text-xs mt-4 opacity-50">
              Electron API: {window.electronAPI ? "Disponible" : "Non disponible"}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}