import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { isDev } from './util.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKEND_URL = 'http://localhost:3001';
let mainWindow: BrowserWindow | null = null;

async function waitForBackend(maxAttempts = 30): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/health`, { timeout: 1000 });
      if (response.data.status === 'ok') {
        console.log('✅ Backend connected');
        return true;
      }
    } catch (error) {
      console.log(`⏳ Waiting for backend... (${i + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return false;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    },
    title: 'Détecteur de Plagiat Pascal'
  });

  if (isDev()) {
    mainWindow.loadURL('http://localhost:1234');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), '/dist-react/index.html'));
  }
}

function setupIPCHandlers() {
  ipcMain.handle('dialog:open-files', async () => {
    if (!mainWindow) return { success: false, files: [], error: 'Window not available' };
    
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile', 'multiSelections'],
        filters: [
          { name: 'Pascal Files', extensions: ['pas', 'p', 'pp'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: true, files: [] };
      }

      const fs = await import('fs/promises');
      const files = await Promise.all(
        result.filePaths.map(async (filePath) => {
          const content = await fs.readFile(filePath, 'utf-8');
          const stats = await fs.stat(filePath);
          
          return {
            name: path.basename(filePath),
            path: filePath,
            content,
            size: stats.size,
            lastModified: stats.mtime.toISOString()
          };
        })
      );

      console.log(`📂 Loaded ${files.length} files`);
      return { success: true, files };
    } catch (error) {
      console.error('File read error:', error);
      return { 
        success: false, 
        files: [], 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  });

  ipcMain.handle('detect:plagiarism', async (event, file1, file2) => {
    try {
      console.log(`🔍 Analyzing: ${file1.name} vs ${file2.name}`);
      
      const response = await axios.post(
        `${BACKEND_URL}/api/detect`,
        { file1, file2 },
        { timeout: 60000 }
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Detection error:', error);
      return {
        success: false,
        error: error.code === 'ECONNREFUSED' 
          ? 'Backend not responding. Ensure it runs on port 3001.' 
          : error.response?.data?.error || error.message
      };
    }
  });

  ipcMain.handle('detect:batch', async (event, files, options) => {
    try {
      console.log(`🔍 Batch analyzing ${files.length} files`);
      
      const response = await axios.post(
        `${BACKEND_URL}/api/detect-batch`,
        { files, threshold: options?.threshold || 0.3 },
        { timeout: 300000 }
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Batch error:', error);
      return {
        success: false,
        error: error.code === 'ECONNREFUSED'
          ? 'Backend not responding'
          : error.response?.data?.error || error.message
      };
    }
  });

  ipcMain.handle('detect:config', async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/config`, { timeout: 5000 });
      return response.data;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}

app.on('ready', async () => {
  console.log('🚀 Starting Electron app...');
  
  const backendReady = await waitForBackend();
  
  if (!backendReady) {
    const choice = dialog.showMessageBoxSync({
      type: 'error',
      title: 'Backend Error',
      message: 'Cannot connect to backend server',
      detail: 'Please start backend:\n\ncd backend\nnpm run dev',
      buttons: ['Retry', 'Quit']
    });
    
    if (choice === 0) {
      app.relaunch();
    }
    app.quit();
    return;
  }

  setupIPCHandlers();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});