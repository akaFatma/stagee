"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Settings,
  Palette,
  Shield,
  Database,
  Bell,
  Download,
  Upload,
  RotateCcw,
  Save,
  AlertTriangle,
  Moon,
  Sun,
  Monitor,
} from "lucide-react"

interface SettingsConfig {
  // Analysis Settings
  sensitivity: number
  minSimilarity: number
  ignoreComments: boolean
  ignoreWhitespace: boolean
  checkStructure: boolean
  checkVariableNames: boolean
  realTimeAnalysis: boolean
  maxFileSize: number

  // UI Settings
  theme: "light" | "dark" | "system"
  language: string
  showLineNumbers: boolean
  highlightSyntax: boolean
  autoSave: boolean

  // Security Settings
  encryptResults: boolean
  requirePassword: boolean
  sessionTimeout: number
  logAnalytics: boolean

  // Export Settings
  defaultExportFormat: string
  includeTimestamp: boolean
  includeMetadata: boolean

  // Notifications
  notifyHighRisk: boolean
  notifyCompletion: boolean
  soundEnabled: boolean
}

export default function SettingsPanel() {
  const [config, setConfig] = useState<SettingsConfig>({
    // Analysis Settings
    sensitivity: 75,
    minSimilarity: 60,
    ignoreComments: true,
    ignoreWhitespace: true,
    checkStructure: true,
    checkVariableNames: false,
    realTimeAnalysis: false,
    maxFileSize: 10,

    // UI Settings
    theme: "dark",
    language: "fr",
    showLineNumbers: true,
    highlightSyntax: true,
    autoSave: true,

    // Security Settings
    encryptResults: false,
    requirePassword: false,
    sessionTimeout: 30,
    logAnalytics: true,

    // Export Settings
    defaultExportFormat: "csv",
    includeTimestamp: true,
    includeMetadata: true,

    // Notifications
    notifyHighRisk: true,
    notifyCompletion: true,
    soundEnabled: false,
  })

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const updateConfig = (key: keyof SettingsConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
    setHasUnsavedChanges(true)
  }

  const saveSettings = () => {
    // Save settings to localStorage or backend
    localStorage.setItem("plagiarism-detector-settings", JSON.stringify(config))
    setHasUnsavedChanges(false)
    // You could add a toast notification here
  }

  const resetSettings = () => {
    const defaultConfig: SettingsConfig = {
      sensitivity: 75,
      minSimilarity: 60,
      ignoreComments: true,
      ignoreWhitespace: true,
      checkStructure: true,
      checkVariableNames: false,
      realTimeAnalysis: false,
      maxFileSize: 10,
      theme: "dark",
      language: "fr",
      showLineNumbers: true,
      highlightSyntax: true,
      autoSave: true,
      encryptResults: false,
      requirePassword: false,
      sessionTimeout: 30,
      logAnalytics: true,
      defaultExportFormat: "csv",
      includeTimestamp: true,
      includeMetadata: true,
      notifyHighRisk: true,
      notifyCompletion: true,
      soundEnabled: false,
    }
    setConfig(defaultConfig)
    setHasUnsavedChanges(true)
  }

  const exportSettings = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `plagiarism-detector-settings-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedConfig = JSON.parse(e.target?.result as string)
        setConfig(importedConfig)
        setHasUnsavedChanges(true)
      } catch (error) {
        alert("Erreur lors de l'importation des paramètres")
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="h-full flex flex-col p-6 gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Paramètres</h2>
            <p className="text-muted-foreground">Configuration de l'application</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">Modifications non sauvegardées</span>
            </div>
          )}
          <Button variant="outline" onClick={resetSettings}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
          <Button onClick={saveSettings} disabled={!hasUnsavedChanges}>
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder
          </Button>
        </div>
      </div>

      <Tabs defaultValue="analysis" className="flex-1">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="analysis">Analyse</TabsTrigger>
          <TabsTrigger value="interface">Interface</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres d'analyse</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Sensibilité de détection ({config.sensitivity}%)</Label>
                <Slider
                  value={[config.sensitivity]}
                  onValueChange={([value]) => updateConfig("sensitivity", value)}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Plus la sensibilité est élevée, plus l'algorithme détectera de similarités
                </p>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Seuil de similarité minimum ({config.minSimilarity}%)</Label>
                <Slider
                  value={[config.minSimilarity]}
                  onValueChange={([value]) => updateConfig("minSimilarity", value)}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Les comparaisons en dessous de ce seuil ne seront pas affichées
                </p>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Taille maximale des fichiers ({config.maxFileSize} MB)</Label>
                <Slider
                  value={[config.maxFileSize]}
                  onValueChange={([value]) => updateConfig("maxFileSize", value)}
                  min={1}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="ignore-comments" className="text-sm font-medium">
                      Ignorer les commentaires
                    </Label>
                    <p className="text-xs text-muted-foreground">Les commentaires ne seront pas pris en compte</p>
                  </div>
                  <Switch
                    id="ignore-comments"
                    checked={config.ignoreComments}
                    onCheckedChange={(checked) => updateConfig("ignoreComments", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="ignore-whitespace" className="text-sm font-medium">
                      Ignorer les espaces
                    </Label>
                    <p className="text-xs text-muted-foreground">Les espaces et tabulations seront normalisés</p>
                  </div>
                  <Switch
                    id="ignore-whitespace"
                    checked={config.ignoreWhitespace}
                    onCheckedChange={(checked) => updateConfig("ignoreWhitespace", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="check-structure" className="text-sm font-medium">
                      Analyser la structure
                    </Label>
                    <p className="text-xs text-muted-foreground">Vérifier la similarité structurelle du code</p>
                  </div>
                  <Switch
                    id="check-structure"
                    checked={config.checkStructure}
                    onCheckedChange={(checked) => updateConfig("checkStructure", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="check-variables" className="text-sm font-medium">
                      Analyser les noms de variables
                    </Label>
                    <p className="text-xs text-muted-foreground">Comparer les noms de variables et fonctions</p>
                  </div>
                  <Switch
                    id="check-variables"
                    checked={config.checkVariableNames}
                    onCheckedChange={(checked) => updateConfig("checkVariableNames", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="real-time" className="text-sm font-medium">
                      Analyse en temps réel
                    </Label>
                    <p className="text-xs text-muted-foreground">Analyser automatiquement lors du chargement</p>
                  </div>
                  <Switch
                    id="real-time"
                    checked={config.realTimeAnalysis}
                    onCheckedChange={(checked) => updateConfig("realTimeAnalysis", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interface" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Apparence et interface
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Thème</Label>
                <Select value={config.theme} onValueChange={(value: any) => updateConfig("theme", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        Clair
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        Sombre
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        Système
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Langue</Label>
                <Select value={config.language} onValueChange={(value) => updateConfig("language", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="line-numbers" className="text-sm font-medium">
                      Afficher les numéros de ligne
                    </Label>
                    <p className="text-xs text-muted-foreground">Dans les comparaisons de code</p>
                  </div>
                  <Switch
                    id="line-numbers"
                    checked={config.showLineNumbers}
                    onCheckedChange={(checked) => updateConfig("showLineNumbers", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="syntax-highlight" className="text-sm font-medium">
                      Coloration syntaxique
                    </Label>
                    <p className="text-xs text-muted-foreground">Mettre en évidence la syntaxe Pascal</p>
                  </div>
                  <Switch
                    id="syntax-highlight"
                    checked={config.highlightSyntax}
                    onCheckedChange={(checked) => updateConfig("highlightSyntax", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-save" className="text-sm font-medium">
                      Sauvegarde automatique
                    </Label>
                    <p className="text-xs text-muted-foreground">Sauvegarder automatiquement les paramètres</p>
                  </div>
                  <Switch
                    id="auto-save"
                    checked={config.autoSave}
                    onCheckedChange={(checked) => updateConfig("autoSave", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Sécurité et confidentialité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Délai d'expiration de session ({config.sessionTimeout} min)
                </Label>
                <Slider
                  value={[config.sessionTimeout]}
                  onValueChange={([value]) => updateConfig("sessionTimeout", value)}
                  min={5}
                  max={120}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  L'application se verrouillera automatiquement après cette durée d'inactivité
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="encrypt-results" className="text-sm font-medium">
                      Chiffrer les résultats
                    </Label>
                    <p className="text-xs text-muted-foreground">Les résultats d'analyse seront chiffrés</p>
                  </div>
                  <Switch
                    id="encrypt-results"
                    checked={config.encryptResults}
                    onCheckedChange={(checked) => updateConfig("encryptResults", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="require-password" className="text-sm font-medium">
                      Mot de passe requis
                    </Label>
                    <p className="text-xs text-muted-foreground">Demander un mot de passe au démarrage</p>
                  </div>
                  <Switch
                    id="require-password"
                    checked={config.requirePassword}
                    onCheckedChange={(checked) => updateConfig("requirePassword", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="log-analytics" className="text-sm font-medium">
                      Journalisation des analyses
                    </Label>
                    <p className="text-xs text-muted-foreground">Conserver un historique des analyses</p>
                  </div>
                  <Switch
                    id="log-analytics"
                    checked={config.logAnalytics}
                    onCheckedChange={(checked) => updateConfig("logAnalytics", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Paramètres d'export
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Format d'export par défaut</Label>
                <Select
                  value={config.defaultExportFormat}
                  onValueChange={(value) => updateConfig("defaultExportFormat", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="txt">Texte</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="include-timestamp" className="text-sm font-medium">
                      Inclure l'horodatage
                    </Label>
                    <p className="text-xs text-muted-foreground">Ajouter la date et l'heure dans les exports</p>
                  </div>
                  <Switch
                    id="include-timestamp"
                    checked={config.includeTimestamp}
                    onCheckedChange={(checked) => updateConfig("includeTimestamp", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="include-metadata" className="text-sm font-medium">
                      Inclure les métadonnées
                    </Label>
                    <p className="text-xs text-muted-foreground">Ajouter les informations de configuration</p>
                  </div>
                  <Switch
                    id="include-metadata"
                    checked={config.includeMetadata}
                    onCheckedChange={(checked) => updateConfig("includeMetadata", checked)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>Import/Export des paramètres</Label>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={exportSettings}>
                    <Download className="h-4 w-4 mr-2" />
                    Exporter les paramètres
                  </Button>
                  <div>
                    <input
                      type="file"
                      accept=".json"
                      onChange={importSettings}
                      className="hidden"
                      id="import-settings"
                    />
                    <Button variant="outline" asChild>
                      <label htmlFor="import-settings" className="cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        Importer les paramètres
                      </label>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notify-high-risk" className="text-sm font-medium">
                      Alertes risque élevé
                    </Label>
                    <p className="text-xs text-muted-foreground">Notifier lors de détection de plagiat probable</p>
                  </div>
                  <Switch
                    id="notify-high-risk"
                    checked={config.notifyHighRisk}
                    onCheckedChange={(checked) => updateConfig("notifyHighRisk", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notify-completion" className="text-sm font-medium">
                      Fin d'analyse
                    </Label>
                    <p className="text-xs text-muted-foreground">Notifier quand l'analyse est terminée</p>
                  </div>
                  <Switch
                    id="notify-completion"
                    checked={config.notifyCompletion}
                    onCheckedChange={(checked) => updateConfig("notifyCompletion", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sound-enabled" className="text-sm font-medium">
                      Sons d'alerte
                    </Label>
                    <p className="text-xs text-muted-foreground">Jouer un son lors des notifications</p>
                  </div>
                  <Switch
                    id="sound-enabled"
                    checked={config.soundEnabled}
                    onCheckedChange={(checked) => updateConfig("soundEnabled", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
