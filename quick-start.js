#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 ML-Powered Claim Verification System');
console.log('=====================================\n');

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`📦 Running: ${command} ${args.join(' ')}`);
    
    const process = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    process.on('error', (error) => {
      reject(error);
    });
  });
}

async function checkEnvironment() {
  console.log('🔍 Checking environment...\n');
  
  // Check Node.js
  try {
    await runCommand('node', ['--version']);
    console.log('✅ Node.js is available');
  } catch (error) {
    console.error('❌ Node.js not found. Please install Node.js 16+');
    return false;
  }
  
  // Check Python
  try {
    await runCommand('python', ['--version']);
    console.log('✅ Python is available');
  } catch (error) {
    try {
      await runCommand('python3', ['--version']);
      console.log('✅ Python3 is available');
    } catch (error2) {
      console.error('❌ Python not found. Please install Python 3.8+');
      return false;
    }
  }
  
  // Check MongoDB (optional)
  try {
    await runCommand('mongod', ['--version']);
    console.log('✅ MongoDB is available');
  } catch (error) {
    console.warn('⚠️ MongoDB not found. Make sure MongoDB is running or use MongoDB Atlas');
  }
  
  return true;
}

async function setupSystem() {
  console.log('\n📦 Setting up the system...\n');
  
  try {
    // Run the ML setup script
    await runCommand('node', ['setup-ml-verification.js']);
    console.log('✅ ML Verification System setup completed');
    return true;
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('\n🧪 Running verification tests...\n');
  
  try {
    await runCommand('node', ['test-ml-verification.js']);
    console.log('✅ Tests completed successfully');
    return true;
  } catch (error) {
    console.warn('⚠️ Some tests failed, but system may still work');
    return false;
  }
}

async function startServer() {
  console.log('\n🚀 Starting the server...\n');
  
  try {
    // Start the server
    await runCommand('npm', ['start']);
  } catch (error) {
    console.error('❌ Server failed to start:', error.message);
    return false;
  }
}

function showUsageInstructions() {
  console.log('\n📋 USAGE INSTRUCTIONS');
  console.log('====================\n');
  
  console.log('🌐 Web Interface:');
  console.log('   1. Open http://localhost:5173 in your browser');
  console.log('   2. Register/Login to access the dashboard');
  console.log('   3. Enter a claim in the verification box');
  console.log('   4. Click "Verify with AI" to test the system\n');
  
  console.log('📝 Test Claims to Try:');
  console.log('   • "Vaccines cause autism" (should be Refuted)');
  console.log('   • "The Earth revolves around the Sun" (should be Supported)');
  console.log('   • "Broccoli is a green vegetable" (should be Supported)');
  console.log('   • "Climate change is a hoax" (should be Refuted)\n');
  
  console.log('🔧 API Testing:');
  console.log('   POST http://localhost:5000/api/verification/verify-claim');
  console.log('   Body: { "claim": "Your claim here" }\n');
  
  console.log('📊 Expected Output Format:');
  console.log('   ✅ Supported (Confidence: 89%)');
  console.log('   ❌ Refuted (Confidence: 77%)');
  console.log('   ⚪ Not Enough Information (Confidence: 64%)\n');
  
  console.log('🔍 Verification Pipeline:');
  console.log('   1. Data Collection (Web Scraping + Database)');
  console.log('   2. Data Preprocessing (Cleaning + Tokenization)');
  console.log('   3. Evidence Retrieval (Similarity Matching)');
  console.log('   4. ML Verification (BERT/RoBERTa Models)');
  console.log('   5. Result Formatting (Your Required Format)\n');
  
  console.log('📚 Documentation:');
  console.log('   • ML_VERIFICATION_GUIDE.md - Complete setup guide');
  console.log('   • requirements.txt - Python dependencies');
  console.log('   • package.json - Node.js dependencies\n');
}

function showTroubleshooting() {
  console.log('🔧 TROUBLESHOOTING');
  console.log('==================\n');
  
  console.log('❌ If ML models fail to load:');
  console.log('   pip install --upgrade transformers torch sentence-transformers\n');
  
  console.log('❌ If web scraping fails:');
  console.log('   • Check internet connection');
  console.log('   • Some fact-checking sites may block requests\n');
  
  console.log('❌ If database connection fails:');
  console.log('   • Start MongoDB: mongod');
  console.log('   • Or use MongoDB Atlas cloud database\n');
  
  console.log('❌ If Python dependencies fail:');
  console.log('   • Windows: pip install torch --index-url https://download.pytorch.org/whl/cpu');
  console.log('   • Mac/Linux: pip install torch\n');
  
  console.log('❌ For memory issues:');
  console.log('   • Use smaller models in MLVerificationService.js');
  console.log('   • Reduce batch sizes for processing\n');
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showUsageInstructions();
    showTroubleshooting();
    return;
  }
  
  if (args.includes('--test-only')) {
    console.log('🧪 Running tests only...\n');
    await runTests();
    return;
  }
  
  if (args.includes('--setup-only')) {
    console.log('📦 Running setup only...\n');
    const envOk = await checkEnvironment();
    if (envOk) {
      await setupSystem();
    }
    return;
  }
  
  // Full setup and start
  console.log('🎯 Starting full setup and launch...\n');
  
  // Check environment
  const envOk = await checkEnvironment();
  if (!envOk) {
    console.log('\n❌ Environment check failed. Please fix the issues above.');
    return;
  }
  
  // Setup system
  const setupOk = await setupSystem();
  if (!setupOk) {
    console.log('\n❌ Setup failed. Check the error messages above.');
    showTroubleshooting();
    return;
  }
  
  // Run tests (optional)
  if (!args.includes('--skip-tests')) {
    console.log('\n🧪 Running verification tests...');
    await runTests();
  }
  
  // Show instructions
  showUsageInstructions();
  
  // Ask if user wants to start server
  if (args.includes('--start-server')) {
    await startServer();
  } else {
    console.log('🚀 To start the server, run: npm start');
    console.log('🌐 Then open http://localhost:5173 in your browser\n');
    
    console.log('✨ Your ML-powered claim verification system is ready!');
    console.log('   Try verifying claims and see the new format in action.');
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Quick start failed:', error);
    showTroubleshooting();
    process.exit(1);
  });
}
