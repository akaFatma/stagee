import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  openFiles: () => ipcRenderer.invoke('dialog:open-files'),
  
  // Detection operations
  detectPlagiarism: (file1: any, file2: any) => 
    ipcRenderer.invoke('detect:plagiarism', file1, file2),
  
  detectBatchPlagiarism: (files: any[], options?: any) => 
    ipcRenderer.invoke('detect:batch', files, options),
  
  getDetectorConfig: () => 
    ipcRenderer.invoke('detect:config'),
  
  // Utility
  isElectron: true
});