const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const cron = require('node-cron');

// Load environment variables
dotenv.config();

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
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io accessible to routes
app.set('io', io);

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/misinformation-platform')
.then(async () => {
  console.log('✅ Connected to MongoDB');
  // Seed default admin account
  await seedDefaultAdmin();
  // Seed sample claims
  await seedClaims();
  // Seed misinformation clusters with geographic data
  await seedClusters();
  
  // Seed community votes for testing (only if we have users and claims)
  try {
    await seedCommunityVotes();
  } catch (error) {
    console.warn('⚠️ Community votes seeding skipped:', error.message);
  }
  
  // Initialize AI Service (non-blocking)
  try {
    console.log('🤖 Initializing AI Service...');
    const aiService = getAIService();
    if (aiService.isConfigured()) {
      console.log(`✅ AI Service ready with provider: ${aiService.getProvider()}`);
    } else {
      console.error('❌ AI Service not configured! Add GEMINI_API_KEY or OPENAI_API_KEY to .env');
    }
  } catch (error) {
    console.error('⚠️  AI Service initialization warning:', error.message);
    console.log('Server will continue without AI features');
  }
  
  // Initialize AI agents after DB connection
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
})
.catch(err => console.error('❌ MongoDB connection error:', err));

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
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    agents: AgentOrchestrator.getAgentStatus(),
    scrapingScheduler: ScrapingScheduler.getStatus()
  });
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
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
});

module.exports = { app, io };
