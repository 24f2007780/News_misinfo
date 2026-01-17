const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.txt', '.pdf', '.docx', '.csv', '.json', '.html', '.htm'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: TXT, PDF, DOCX, CSV, JSON, HTML'));
    }
  }
});

// In-memory storage for demo purposes
let ingestionJobs = [];
let jobIdCounter = 1;

// Get ingestor agent status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    // Simulate agent status
    const status = {
      status: 'running',
      queueSize: Math.floor(Math.random() * 10),
      processedCount: 1247 + Math.floor(Math.random() * 100),
      errorCount: Math.floor(Math.random() * 5),
      uptime: Date.now() - (24 * 60 * 60 * 1000), // 24 hours ago
      lastAction: {
        action: 'Processed social media batch',
        timestamp: new Date().toISOString()
      }
    };

    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get ingestion jobs
router.get('/jobs', authenticateToken, async (req, res) => {
  try {
    // Add some sample jobs if empty
    if (ingestionJobs.length === 0) {
      ingestionJobs = [
        {
          id: 'job-1',
          source: 'Twitter',
          status: 'completed',
          startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          itemsProcessed: 156,
          successRate: 94,
          duration: '1h 23m'
        },
        {
          id: 'job-2',
          source: 'News Feeds',
          status: 'running',
          startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          itemsProcessed: 42,
          successRate: 98,
          duration: '30m'
        }
      ];
    }

    res.json(ingestionJobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start ingestion from a source
router.post('/start', authenticateToken, async (req, res) => {
  try {
    const { source, config } = req.body;

    if (!source) {
      return res.status(400).json({ error: 'Source is required' });
    }

    // Create new ingestion job
    const job = {
      id: `job-${jobIdCounter++}`,
      source: source.charAt(0).toUpperCase() + source.slice(1),
      status: 'running',
      startTime: new Date().toISOString(),
      itemsProcessed: 0,
      successRate: 100,
      duration: '0s',
      config: config
    };

    ingestionJobs.unshift(job);

    // Simulate job progress
    setTimeout(() => {
      const jobIndex = ingestionJobs.findIndex(j => j.id === job.id);
      if (jobIndex !== -1) {
        ingestionJobs[jobIndex].itemsProcessed = Math.floor(Math.random() * 50) + 10;
        ingestionJobs[jobIndex].duration = '2m';
      }
    }, 2000);

    // Complete job after some time
    setTimeout(() => {
      const jobIndex = ingestionJobs.findIndex(j => j.id === job.id);
      if (jobIndex !== -1) {
        ingestionJobs[jobIndex].status = 'completed';
        ingestionJobs[jobIndex].itemsProcessed = Math.floor(Math.random() * 100) + 50;
        ingestionJobs[jobIndex].successRate = Math.floor(Math.random() * 20) + 80;
        ingestionJobs[jobIndex].duration = Math.floor(Math.random() * 10) + 5 + 'm';
      }
    }, 10000);

    console.log(`🚀 Started ${source} ingestion job:`, job.id);
    res.json({ message: `Started ${source} ingestion`, jobId: job.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stop ingestion job
router.post('/stop/:jobId', authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const jobIndex = ingestionJobs.findIndex(j => j.id === jobId);
    if (jobIndex === -1) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (ingestionJobs[jobIndex].status === 'running') {
      ingestionJobs[jobIndex].status = 'paused';
      console.log(`⏸️ Stopped ingestion job: ${jobId}`);
      res.json({ message: 'Job stopped successfully' });
    } else {
      res.status(400).json({ error: 'Job is not running' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint for upload functionality
router.get('/upload/test', (req, res) => {
  console.log('📡 Upload test endpoint hit');
  res.json({ 
    message: 'Upload endpoint is accessible',
    timestamp: new Date().toISOString(),
    maxFileSize: '10MB',
    supportedTypes: ['.txt', '.pdf', '.docx', '.csv', '.json', '.html', '.htm']
  });
});

// Upload files for ingestion (temporarily remove auth for testing)
router.post('/upload', (req, res, next) => {
  upload.array('files', 10)(req, res, (err) => {
    if (err) {
      console.error('❌ Multer error:', err.message);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
      }
      if (err.message.includes('Invalid file type')) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(400).json({ error: 'File upload error: ' + err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    console.log('📁 Upload request received');
    console.log('User:', 'Testing without auth');
    console.log('Files in request:', req.files?.length || 0);
    console.log('Request headers:', req.headers.authorization ? 'Token present' : 'No token');
    
    if (!req.files || req.files.length === 0) {
      console.error('❌ No files in upload request');
      return res.status(400).json({ error: 'No files uploaded' });
    }

    console.log('📋 Processing uploaded files...');
    const uploadedFiles = req.files.map(file => {
      console.log(`📄 File: ${file.originalname} (${file.size} bytes, ${file.mimetype})`);
      return {
        originalName: file.originalname,
        filename: file.filename,
        size: file.size,
        path: file.path,
        mimetype: file.mimetype
      };
    });

    // Process each file and extract information
    console.log('🔄 Starting file processing...');
    const extractedData = [];
    
    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      try {
        console.log(`📊 Processing file ${i + 1}/${uploadedFiles.length}: ${file.originalName}`);
        
        // Check if file exists
        const fs = require('fs');
        if (!fs.existsSync(file.path)) {
          throw new Error(`File not found at path: ${file.path}`);
        }
        
        const extractedInfo = await processFile(file);
        console.log(`✅ Successfully processed: ${file.originalName}`);
        
        extractedData.push({
          filename: file.originalName,
          size: file.size,
          type: getFileType(file.originalName),
          text: extractedInfo.text || 'No text extracted',
          fullTextLength: extractedInfo.fullTextLength || 0,
          extractedClaims: extractedInfo.extractedClaims || [],
          metadata: extractedInfo.metadata || { type: 'unknown' },
          processedAt: extractedInfo.processedAt || new Date().toISOString()
        });
      } catch (error) {
        console.error(`❌ Error processing file ${file.originalName}:`, error);
        extractedData.push({
          filename: file.originalName,
          size: file.size,
          type: getFileType(file.originalName),
          error: error.message,
          text: `Failed to process file: ${error.message}`,
          extractedClaims: [],
          metadata: { type: 'error' },
          processedAt: new Date().toISOString()
        });
      }
    }

    // Create ingestion job for uploaded files
    const job = {
      id: `job-${jobIdCounter++}`,
      source: 'File Upload',
      status: 'processing',
      startTime: new Date().toISOString(),
      itemsProcessed: 0,
      successRate: 100,
      duration: '0s',
      files: uploadedFiles
    };

    ingestionJobs.unshift(job);

    // Simulate job completion
    setTimeout(() => {
      const jobIndex = ingestionJobs.findIndex(j => j.id === job.id);
      if (jobIndex !== -1) {
        ingestionJobs[jobIndex].status = 'completed';
        ingestionJobs[jobIndex].itemsProcessed = uploadedFiles.length;
        ingestionJobs[jobIndex].successRate = 100;
        ingestionJobs[jobIndex].duration = '30s';
      }
    }, 3000);

    console.log(`✅ Successfully uploaded and processed ${uploadedFiles.length} files`);
    console.log('📤 Sending response to client...');
    
    const response = { 
      success: true,
      message: `Uploaded ${uploadedFiles.length} files successfully`,
      files: uploadedFiles.map(f => ({ name: f.originalName, size: f.size })),
      extractedData: extractedData,
      jobId: job.id
    };
    
    console.log('📊 Response data:', {
      filesCount: uploadedFiles.length,
      extractedDataCount: extractedData.length,
      jobId: job.id
    });
    
    res.json(response);
  } catch (error) {
    console.error('❌ Upload error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Helper function to process uploaded files
async function processFile(file) {
  const fs = require('fs');
  
  try {
    console.log(`📄 Processing file: ${file.originalName} (${file.size} bytes)`);
    
    // Read file content based on type
    let text = '';
    let metadata = {};
    const ext = path.extname(file.originalName).toLowerCase();
    
    if (ext === '.txt') {
      // Read text files directly
      text = fs.readFileSync(file.path, 'utf8');
      metadata = { type: 'text', encoding: 'utf8' };
      
    } else if (ext === '.csv') {
      // Read CSV files and convert to readable format
      const csvContent = fs.readFileSync(file.path, 'utf8');
      const lines = csvContent.split('\n');
      const headers = lines[0]?.split(',') || [];
      
      text = `CSV File with ${lines.length} rows and columns: ${headers.join(', ')}\n\n`;
      text += csvContent.substring(0, 2000); // First 2000 chars
      metadata = { type: 'csv', rows: lines.length, columns: headers.length };
      
    } else if (ext === '.json') {
      // Parse JSON files
      const jsonData = JSON.parse(fs.readFileSync(file.path, 'utf8'));
      text = JSON.stringify(jsonData, null, 2);
      metadata = { type: 'json', keys: Object.keys(jsonData).length };
      
    } else if (ext === '.html' || ext === '.htm') {
      // Read HTML files and extract text content
      const htmlContent = fs.readFileSync(file.path, 'utf8');
      // Simple HTML tag removal for text extraction
      text = htmlContent
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove styles
        .replace(/<[^>]*>/g, ' ') // Remove HTML tags
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      
      const tagCount = (htmlContent.match(/<[^>]*>/g) || []).length;
      metadata = { 
        type: 'html', 
        originalSize: htmlContent.length,
        extractedTextSize: text.length,
        htmlTags: tagCount
      };
      
    } else if (ext === '.pdf') {
      // For PDF files - simulate extraction (in real implementation, use pdf-parse)
      text = `PDF Document: ${file.originalName}
      
This is a simulated extraction from a PDF file. In a production environment, this would use libraries like 'pdf-parse' or 'pdf2pic' to extract actual text content from PDF files.

Sample extracted content that might contain claims:
- Climate change is affecting global weather patterns
- Vaccines have been proven safe and effective through clinical trials
- The Earth's atmosphere contains approximately 78% nitrogen
- Regular exercise can reduce the risk of heart disease
- Artificial intelligence is transforming various industries`;
      
      metadata = { type: 'pdf', pages: Math.floor(Math.random() * 20) + 1 };
      
    } else if (ext === '.docx') {
      // For DOCX files - simulate extraction (in real implementation, use mammoth or docx-parser)
      text = `Word Document: ${file.originalName}
      
This is a simulated extraction from a DOCX file. In a production environment, this would use libraries like 'mammoth' or 'docx-parser' to extract actual text content from Word documents.

Sample extracted content that might contain claims:
- Social media usage has increased significantly among teenagers
- Renewable energy sources are becoming more cost-effective
- The human brain contains approximately 86 billion neurons
- Drinking water helps maintain proper hydration levels
- Technology adoption varies across different age groups`;
      
      metadata = { type: 'docx', wordCount: Math.floor(Math.random() * 5000) + 500 };
      
    } else {
      text = `Unsupported file format: ${ext}`;
      metadata = { type: 'unknown' };
    }

    console.log(`✅ Extracted ${text.length} characters from ${file.originalName}`);

    // Extract potential claims using enhanced text analysis
    const claims = extractClaimsFromText(text, file.originalName);
    
    return {
      filename: file.originalName,
      text: text.substring(0, 2000), // Limit text length for display
      fullTextLength: text.length,
      extractedClaims: claims,
      metadata: metadata,
      processedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('File processing error:', error);
    return {
      filename: file.originalName,
      text: `Error reading file content: ${error.message}`,
      fullTextLength: 0,
      extractedClaims: [],
      metadata: { type: 'error' },
      error: error.message
    };
  }
}

// Helper function to extract claims from text
function extractClaimsFromText(text, filename = '') {
  const claims = [];
  
  console.log(`🔍 Extracting claims from ${filename || 'text'}...`);
  
  // Enhanced claim detection patterns
  const claimPatterns = [
    // Factual statements
    /([A-Z][^.!?]*(?:is|are|was|were|will be|has been|have been)[^.!?]*[.!?])/gi,
    // Causal relationships
    /([A-Z][^.!?]*(?:cause|causes|prevent|prevents|cure|cures|treat|treats|help|helps)[^.!?]*[.!?])/gi,
    // Claims and assertions
    /([A-Z][^.!?]*(?:claim|claims|assert|asserts|state|states|report|reports)[^.!?]*[.!?])/gi,
    // Statistical claims
    /([A-Z][^.!?]*(?:\d+%|\d+ percent|approximately|about|nearly)[^.!?]*[.!?])/gi
  ];

  claimPatterns.forEach((pattern, patternIndex) => {
    const matches = text.match(pattern);
    if (matches) {
      console.log(`📋 Pattern ${patternIndex + 1} found ${matches.length} potential claims`);
      
      matches.slice(0, 3).forEach((match, idx) => { // Limit to 3 claims per pattern
        const cleanMatch = match.trim().replace(/^[-•]\s*/, ''); // Remove bullet points
        
        if (cleanMatch.length > 15 && cleanMatch.length < 300) { // Reasonable claim length
          const category = categorizeClaimText(cleanMatch);
          const confidence = Math.random() * 0.3 + 0.6; // Random confidence between 0.6-0.9
          
          claims.push({
            text: cleanMatch,
            confidence: confidence,
            category: category,
            source: 'file_extraction',
            extractedFrom: filename,
            type: getPatternType(patternIndex)
          });
        }
      });
    }
  });

  // If no claims found, extract sentences that might be claims
  if (claims.length === 0) {
    console.log('⚠️ No pattern matches found, extracting potential claim sentences...');
    
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const potentialClaims = sentences.slice(0, 5).map(sentence => {
      const cleanSentence = sentence.trim();
      return {
        text: cleanSentence.length > 200 ? cleanSentence.substring(0, 200) + '...' : cleanSentence,
        confidence: 0.5,
        category: 'other',
        source: 'sentence_extraction',
        extractedFrom: filename,
        type: 'sentence'
      };
    });
    
    claims.push(...potentialClaims);
  }

  console.log(`✅ Extracted ${claims.length} potential claims from ${filename}`);
  return claims.slice(0, 8); // Limit to 8 claims max
}

// Helper function to categorize claim text
function categorizeClaimText(claimText) {
  const text = claimText.toLowerCase();
  
  if (text.includes('vaccine') || text.includes('medicine') || text.includes('health') || text.includes('disease')) {
    return 'health_medicine';
  } else if (text.includes('climate') || text.includes('environment') || text.includes('carbon')) {
    return 'environment_climate';
  } else if (text.includes('politic') || text.includes('government') || text.includes('election')) {
    return 'politics_governance';
  } else if (text.includes('economy') || text.includes('financial') || text.includes('market')) {
    return 'economics_finance';
  } else if (text.includes('science') || text.includes('technology') || text.includes('research')) {
    return 'science_technology';
  } else {
    return 'other';
  }
}

// Helper function to get pattern type description
function getPatternType(patternIndex) {
  const types = ['factual_statement', 'causal_relationship', 'claim_assertion', 'statistical_claim'];
  return types[patternIndex] || 'general';
}

// Helper function to get random category
function getRandomCategory() {
  const categories = ['health', 'politics', 'science', 'technology', 'economy', 'general'];
  return categories[Math.floor(Math.random() * categories.length)];
}

// Helper function to determine file type
function getFileType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const typeMap = {
    '.txt': 'Text Document',
    '.pdf': 'PDF Document',
    '.docx': 'Word Document',
    '.csv': 'CSV Spreadsheet',
    '.json': 'JSON Data'
  };
  return typeMap[ext] || 'Unknown';
}

// Manual text input for ingestion
router.post('/manual', authenticateToken, async (req, res) => {
  try {
    const { text, source, timestamp } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text content is required' });
    }

    // Create ingestion job for manual text
    const job = {
      id: `job-${jobIdCounter++}`,
      source: 'Manual Input',
      status: 'processing',
      startTime: new Date().toISOString(),
      itemsProcessed: 0,
      successRate: 100,
      duration: '0s',
      textContent: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      sourceType: source
    };

    ingestionJobs.unshift(job);

    // Simulate text processing
    setTimeout(() => {
      const jobIndex = ingestionJobs.findIndex(j => j.id === job.id);
      if (jobIndex !== -1) {
        ingestionJobs[jobIndex].status = 'completed';
        ingestionJobs[jobIndex].itemsProcessed = 1;
        ingestionJobs[jobIndex].successRate = 100;
        ingestionJobs[jobIndex].duration = '5s';
      }
    }, 2000);

    console.log(`✍️ Manual text submitted for ingestion: ${text.substring(0, 50)}...`);
    res.json({ 
      message: 'Text submitted for processing',
      jobId: job.id,
      preview: text.substring(0, 100)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get ingestion statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = {
      totalJobs: ingestionJobs.length,
      runningJobs: ingestionJobs.filter(j => j.status === 'running').length,
      completedJobs: ingestionJobs.filter(j => j.status === 'completed').length,
      failedJobs: ingestionJobs.filter(j => j.status === 'failed').length,
      totalItemsProcessed: ingestionJobs.reduce((sum, job) => sum + (job.itemsProcessed || 0), 0),
      averageSuccessRate: ingestionJobs.length > 0 
        ? Math.round(ingestionJobs.reduce((sum, job) => sum + (job.successRate || 0), 0) / ingestionJobs.length)
        : 0
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
