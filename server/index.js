const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const cron = require('node-cron');
dotenv.config();
const PORT = process.env.PORT || 10000;  // Server will run on port 5000

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is missing in .env');
  process.exit(1);
}

// Import routes
const authRoutes = require('./routes/auth');
const claimRoutes = require('./routes/claims');
const agentRoutes = require('./routes/agents');
const verificationRoutes = require('./routes/verification');
const analyticsRoutes = require('./routes/analytics');
const governanceRoutes = require('./routes/governance');
const userFeaturesRoutes = require('./routes/userFeatures');
const communityRoutes = require('./routes/community');
const ingestorRoutes = require('./routes/ingestor');
const settingsRoutes = require('./routes/settings');

// Import services
const AgentOrchestrator = require('./services/AgentOrchestrator');
const ScrapingScheduler = require('./services/ScrapingScheduler');
const { initializeAgents } = require('./agents');
const { getAIService } = require('./services/AIService');
const seedDefaultAdmin = require('./utils/seedAdmin');
const seedClaims = require('./utils/seedClaims');
const seedClusters = require('./utils/seedClusters');
const seedCommunityVotes = require('./utils/seedCommunityVotes');

const app = express();
const server = http.createServer(app);
// In server/index.js
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://news-misinfo.onrender.com', 'https://www.news-misinfo.onrender.com']
    : 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST']
}

app.use(cors(corsOptions))

const io = socketIo(server, {
  cors: corsOptions,
  path: '/socket.io/'
})

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io accessible to routes
app.set('io', io);

// Serve static files from the React app
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
  });
}
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/governance', governanceRoutes);
app.use('/api/user', userFeaturesRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/agents/ingestor', ingestorRoutes);
app.use('/api/admin/settings', settingsRoutes);

// Health check
app.get('/health', (req, res) => {
  const mongoStatus = {
    status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    error: mongoose.connection.readyState === 1 ? null : 'Not connected to MongoDB'
  };
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    database: {
      mongodb: mongoStatus.status,
      error: mongoStatus.error
    }
  });
});

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
})
.then(async () => {
  console.log('✅ Connected to MongoDB');    
    // Seed data
    await seedDefaultAdmin();
    await seedClaims();
    await seedClusters();
    
    try {
      await seedCommunityVotes();
    } catch (error) {
      console.warn('⚠️ Community votes seeding skipped:', error.message);
    }
    // Initialize AI Service
    try {
      console.log('🤖 Initializing AI Service...');
      const aiService = getAIService();
      if (aiService.isConfigured()) {
        console.log(`✅ AI Service ready with provider: ${aiService.getProvider()}`);
      } else {
        console.error('❌ AI Service not configured! Add GEMINI_API_KEY or OPENAI_API_KEY to .env');
      }
    } catch (error) {
      console.error('⚠️ AI Service initialization warning:', error.message);
      console.log('Server will continue without AI features');
    }
    // Initialize AI agents
    try {
      console.log('🚀 Starting agent initialization...');
      const initializedAgents = initializeAgents(io);
      console.log('✅ Agent initialization complete. Agents:', Object.keys(initializedAgents));
    } catch (error) {
      console.error('❌ Failed to initialize agents:', error);
      console.error('Error stack:', error.stack);
    }
    // Initialize ML Verification Service
    try {
      console.log('🤖 Initializing ML Verification Service...');
      const MLVerificationService = require('./services/MLVerificationService');
      const mlInitialized = await MLVerificationService.initializeModels();
      if (mlInitialized) {
        console.log('✅ ML Verification Service initialized successfully');
      } else {
        console.warn('⚠️ ML Verification Service initialization failed - will use fallback methods');
      }
    } catch (error) {
      console.warn('⚠️ ML Verification Service initialization warning:', error.message);
      console.log('Server will continue with AI and web scraping verification methods');
    }
    // Start web scraping scheduler
    try {
      console.log('🕐 Starting Web Scraping Scheduler...');
      ScrapingScheduler.start();
      console.log('✅ Web Scraping Scheduler started successfully');
    } catch (error) {
      console.error('❌ Failed to start scraping scheduler:', error);
    }
    // Start the server after all initializations
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Client URL: http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  socket.on('subscribe-admin', () => {
    socket.join('admin-room');
    console.log('👨‍💼 Admin subscribed:', socket.id);
  });

  socket.on('subscribe-user', (userId) => {
    socket.join(`user-${userId}`);
    console.log('👤 User subscribed:', userId);
  });

  socket.on('verify-claim', async (data) => {
    try {
      const result = await AgentOrchestrator.verifyClaim(data.claim);
      socket.emit('verification-result', result);
    } catch (error) {
      socket.emit('verification-error', { error: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Scheduled tasks
// Daily intelligence brief generation
cron.schedule('0 8 * * *', async () => {
  console.log('📊 Generating daily intelligence brief...');
  const brief = await AgentOrchestrator.generateDailyBrief();
  io.to('admin-room').emit('daily-brief', brief);
});

// Hourly misinformation spike detection
cron.schedule('0 * * * *', async () => {
  console.log('🔍 Checking for misinformation spikes...');
  const spikes = await AgentOrchestrator.detectSpikes();
  if (spikes.length > 0) {
    io.to('admin-room').emit('spike-alert', spikes);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

module.exports = { app, io };
