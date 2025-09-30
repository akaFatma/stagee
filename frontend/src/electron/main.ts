import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import path from 'path';
import { isDev } from './util.js';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:3001';
let mainWindow: BrowserWindow | null = null;

// Check if backend is running
async function waitForBackend(maxAttempts = 30): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await axios.get(`${BACKEND_URL}/api/health`);
      console.log('✅ Backend is ready');
      return true;
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
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  if (isDev()) {
    mainWindow.loadURL('http://localhost:1234');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), '/dist-react/index.html'));
  }
}

// IPC Handlers
function setupIPCHandlers() {
  // File selection dialog
  ipcMain.handle('dialog:open-files', async () => {
    if (!mainWindow) return { success: false, files: [] };
    
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile', 'multiSelections'],
        filters: [
          { name: 'Pascal Files', extensions: ['pas'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, files: [] };
      }

      // Read file contents
      const fs = require('fs').promises;
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

      return { success: true, files };
    } catch (error) {
      console.error('Error reading files:', error);
      return { 
        success: false, 
        files: [], 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  });

  // Plagiarism detection
  ipcMain.handle('detect:plagiarism', async (event, file1, file2) => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/detect`, {
        file1,
        file2
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Detection error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  });

  // Batch detection
  ipcMain.handle('detect:batch', async (event, files, options) => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/detect-batch`, {
        files,
        threshold: options?.threshold
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Batch detection error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  });

  // Get detector config
  ipcMain.handle('detect:config', async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/config`);
      return response.data;
    } catch (error: any) {
      console.error('Config error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  });
}

app.on('ready', async () => {
  // Wait for backend to be ready
  const backendReady = await waitForBackend();
  
  if (!backendReady) {
    dialog.showErrorBox(
      'Backend Error',
      'Could not connect to the backend server. Please ensure it is running on port 3001.'
    );
    app.quit();
    return;
  }

  setupIPCHandlers();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});