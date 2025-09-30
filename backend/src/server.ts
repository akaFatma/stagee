import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { PascalPlagiarismDetector, FileInput, PlagiarismResult, BatchResult } from './services/plagiarism/pascalPlagiarismDetector';

const app: Express = express();
const PORT = process.env.PORT || 3001;


const detector = new PascalPlagiarismDetector();

// Middleware
app.use(cors({
  origin: ['http://localhost:1234', 'http://localhost:5173'], 
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === '.pas') {
      cb(null, true);
    } else {
      cb(new Error('Only .pas files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Pascal Plagiarism Detector API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Get detector configuration
app.get('/api/config', async (req: Request, res: Response) => {
  try {
    const config = detector.getConfig();
    res.json({
      success: true,
      config
    });
  } catch (error) {
    console.error('Error getting config:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Detect plagiarism between two files
app.post('/api/detect', async (req: Request, res: Response) => {
  try {
    const { file1, file2, threshold } = req.body;

    if (!file1 || !file2) {
      return res.status(400).json({
        success: false,
        error: 'Both file1 and file2 are required'
      });
    }

    if (!file1.name || !file1.content || !file2.name || !file2.content) {
      return res.status(400).json({
        success: false,
        error: 'Files must have name and content properties'
      });
    }

    console.log(`🔍 Analyzing ${file1.name} vs ${file2.name}`);

    const result: PlagiarismResult = await detector.detectPlagiarism(
      file1 as FileInput,
      file2 as FileInput,
      threshold
    );

    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Error detecting plagiarism:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Batch plagiarism detection
app.post('/api/detect-batch', async (req: Request, res: Response) => {
  try {
    const { files, threshold } = req.body;

    if (!files || !Array.isArray(files)) {
      return res.status(400).json({
        success: false,
        error: 'Files array is required'
      });
    }

    if (files.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'At least 2 files are required for batch analysis'
      });
    }

    // Validate all files
    for (const file of files) {
      if (!file.name || !file.content) {
        return res.status(400).json({
          success: false,
          error: 'All files must have name and content properties'
        });
      }
    }

    console.log(`🔍 Batch analysis of ${files.length} files`);

    const result: BatchResult = await detector.detectBatchPlagiarism(
      files as FileInput[],
      threshold
    );

    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Error in batch detection:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// File upload endpoint (alternative to sending JSON)
app.post('/api/upload', upload.array('files', 50), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    const processedFiles = files.map(file => ({
      name: file.originalname,
      content: file.buffer.toString('utf-8'),
      size: file.size,
      metadata: {
        timestamp: new Date(),
        language: 'pascal'
      }
    }));

    res.json({
      success: true,
      files: processedFiles,
      count: processedFiles.length
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Generate report for a result
app.post('/api/report', (req: Request, res: Response) => {
  try {
    const { result } = req.body;

    if (!result) {
      return res.status(400).json({
        success: false,
        error: 'Result object is required'
      });
    }

    const report = PascalPlagiarismDetector.generateReport(result as PlagiarismResult);

    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Initialize and start server
async function startServer() {
  try {
    console.log('🚀 Initializing Pascal Plagiarism Detector...');
    await detector.initialize();
    
    app.listen(PORT, () => {
      console.log('✅ Server initialized successfully');
      console.log(` Server running on http://localhost:${PORT}`);
      console.log(` API endpoints:`);
      console.log(`   - GET  /api/health`);
      console.log(`   - GET  /api/config`);
      console.log(`   - POST /api/detect`);
      console.log(`   - POST /api/detect-batch`);
      console.log(`   - POST /api/upload`);
      console.log(`   - POST /api/report`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

