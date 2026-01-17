const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Enhanced Verification System\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    console.log('📋 Creating .env file from .env.example...');
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created successfully!');
  } else {
    console.log('❌ .env.example file not found');
    process.exit(1);
  }
} else {
  console.log('✅ .env file already exists');
}

// Read current .env content
const envContent = fs.readFileSync(envPath, 'utf8');

// Check configuration
console.log('\n🔍 Checking configuration...');

const hasGeminiKey = envContent.includes('GEMINI_API_KEY=') && 
                   !envContent.includes('GEMINI_API_KEY=your-gemini-api-key-here');
const hasOpenAIKey = envContent.includes('OPENAI_API_KEY=') && 
                    !envContent.includes('OPENAI_API_KEY=sk-your-openai-api-key-here');
const aiProvider = envContent.match(/AI_PROVIDER=(\w+)/)?.[1] || 'gemini';

console.log(`   AI Provider: ${aiProvider}`);
console.log(`   Gemini API Key configured: ${hasGeminiKey ? '✅' : '❌'}`);
console.log(`   OpenAI API Key configured: ${hasOpenAIKey ? '✅' : '❌'}`);

if (aiProvider === 'gemini' && !hasGeminiKey) {
  console.log('\n⚠️  WARNING: Gemini API key not configured!');
  console.log('   1. Get a free API key from: https://makersuite.google.com/app/apikey');
  console.log('   2. Replace "your-gemini-api-key-here" in .env file with your actual key');
  console.log('   3. Restart the server');
} else if (aiProvider === 'openai' && !hasOpenAIKey) {
  console.log('\n⚠️  WARNING: OpenAI API key not configured!');
  console.log('   1. Get an API key from: https://platform.openai.com/api-keys');
  console.log('   2. Replace "sk-your-openai-api-key-here" in .env file with your actual key');
  console.log('   3. Restart the server');
} else {
  console.log('\n✅ AI configuration looks good!');
}

console.log('\n📚 Enhanced Verification Features:');
console.log('   ✅ Scientific fact database (built-in knowledge)');
console.log('   ✅ Web scraping from fact-checking sites');
console.log('   ✅ AI-powered analysis (Gemini/OpenAI)');
console.log('   ✅ Combined result analysis');
console.log('   ✅ Confidence scoring');

console.log('\n🧪 To test the system, run:');
console.log('   node test-verification.js');

console.log('\n🚀 To start the server, run:');
console.log('   npm run dev');

console.log('\n📝 The "Earth revolves around the Sun" claim should now show as:');
console.log('   Verdict: TRUE');
console.log('   Confidence: 99%');
console.log('   Source: Scientific Knowledge Base');

console.log('\n✨ Setup complete! Your fact-checker is now enhanced with AI and scientific knowledge.');
