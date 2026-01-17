#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up ML Verification System...\n');

async function runCommand(command, args, options = {}) {
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

async function checkPython() {
  try {
    await runCommand('python', ['--version']);
    return true;
  } catch (error) {
    try {
      await runCommand('python3', ['--version']);
      return true;
    } catch (error2) {
      return false;
    }
  }
}

async function installPythonDependencies() {
  console.log('\n📚 Installing Python ML dependencies...');
  
  const pythonCommand = await checkPython() ? 'python' : 'python3';
  
  try {
    // Install pip if not available
    console.log('🔧 Ensuring pip is available...');
    await runCommand(pythonCommand, ['-m', 'ensurepip', '--upgrade']);
  } catch (error) {
    console.warn('⚠️ Could not ensure pip - it might already be installed');
  }

  // Install ML dependencies
  const dependencies = [
    'transformers==4.35.2',
    'torch==2.1.1',
    'sentence-transformers==2.2.2',
    'numpy==1.24.3',
    'scikit-learn==1.3.2',
    'datasets==2.14.6'
  ];

  for (const dep of dependencies) {
    try {
      console.log(`📦 Installing ${dep}...`);
      await runCommand(pythonCommand, ['-m', 'pip', 'install', dep]);
    } catch (error) {
      console.error(`❌ Failed to install ${dep}:`, error.message);
      throw error;
    }
  }
}

async function testMLSetup() {
  console.log('\n🧪 Testing ML setup...');
  
  const testScript = `
import sys
try:
    import transformers
    import torch
    import sentence_transformers
    import numpy as np
    import sklearn
    print("✅ All ML dependencies imported successfully")
    print(f"🤖 Transformers version: {transformers.__version__}")
    print(f"🔥 PyTorch version: {torch.__version__}")
    print(f"📊 NumPy version: {np.__version__}")
    sys.exit(0)
except ImportError as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)
`;

  const testFile = path.join(__dirname, 'test_ml_setup.py');
  fs.writeFileSync(testFile, testScript);

  try {
    const pythonCommand = await checkPython() ? 'python' : 'python3';
    await runCommand(pythonCommand, [testFile]);
    fs.unlinkSync(testFile); // Clean up test file
    return true;
  } catch (error) {
    fs.unlinkSync(testFile); // Clean up test file
    return false;
  }
}

async function installNodeDependencies() {
  console.log('\n📦 Installing Node.js dependencies...');
  
  try {
    await runCommand('npm', ['install']);
    console.log('✅ Node.js dependencies installed');
  } catch (error) {
    console.error('❌ Failed to install Node.js dependencies:', error.message);
    throw error;
  }
}

async function main() {
  try {
    // Check if Python is available
    const pythonAvailable = await checkPython();
    if (!pythonAvailable) {
      console.error('❌ Python is not installed or not in PATH');
      console.log('Please install Python 3.8+ from https://python.org');
      process.exit(1);
    }

    console.log('✅ Python is available');

    // Install Node.js dependencies
    await installNodeDependencies();

    // Install Python ML dependencies
    await installPythonDependencies();

    // Test ML setup
    const mlWorking = await testMLSetup();
    
    if (mlWorking) {
      console.log('\n🎉 ML Verification System setup complete!');
      console.log('\n📋 Next steps:');
      console.log('1. Start the server: npm start');
      console.log('2. The ML models will be initialized automatically');
      console.log('3. Test claim verification in the web interface');
      console.log('\n💡 Note: First-time model loading may take a few minutes');
    } else {
      console.log('\n⚠️ ML setup completed but testing failed');
      console.log('The system will fall back to AI and web scraping methods');
    }

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Ensure Python 3.8+ is installed');
    console.log('2. Try running: pip install --upgrade pip');
    console.log('3. For Windows: pip install torch --index-url https://download.pytorch.org/whl/cpu');
    console.log('4. Check your internet connection');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { installPythonDependencies, testMLSetup };
