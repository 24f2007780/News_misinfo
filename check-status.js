require('dotenv').config();

console.log('🔍 System Status Check\n');

// Check environment variables
console.log('📋 Environment Configuration:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`   AI_PROVIDER: ${process.env.AI_PROVIDER || 'not set'}`);
console.log(`   GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ configured' : '❌ not configured'}`);
console.log(`   OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ configured' : '❌ not configured'}`);
console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? '✅ configured' : '❌ not configured'}`);

console.log('\n🧪 Testing Enhanced Verification Service...');

try {
  const EnhancedVerificationService = require('./server/services/EnhancedVerificationService');
  
  // Test scientific fact recognition
  const testClaim = 'The Earth revolves around the Sun';
  console.log(`\n🔍 Testing claim: "${testClaim}"`);
  
  EnhancedVerificationService.verifyClaim(testClaim)
    .then(result => {
      console.log('✅ SUCCESS!');
      console.log(`   Verdict: ${result.verdict.toUpperCase()}`);
      console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`   Source: ${result.source}`);
      console.log(`   Explanation: ${result.explanation?.short || 'No explanation'}`);
      
      if (result.verdict === 'true' && result.confidence > 0.9) {
        console.log('\n🎉 Enhanced verification is working correctly!');
        console.log('   The "Earth revolves around Sun" claim now shows as TRUE with high confidence.');
      } else {
        console.log('\n⚠️  Enhanced verification needs attention.');
        console.log('   Expected: TRUE with >90% confidence');
        console.log(`   Got: ${result.verdict} with ${(result.confidence * 100).toFixed(1)}% confidence`);
      }
    })
    .catch(error => {
      console.error('❌ ERROR:', error.message);
      
      if (error.message.includes('not configured')) {
        console.log('\n💡 Solution:');
        console.log('   1. Get a free Gemini API key: https://makersuite.google.com/app/apikey');
        console.log('   2. Add it to your .env file: GEMINI_API_KEY=your-key-here');
        console.log('   3. Restart the server');
      }
    });
    
} catch (error) {
  console.error('❌ Failed to load Enhanced Verification Service:', error.message);
}

console.log('\n📝 Next Steps:');
console.log('   1. Configure API key if needed');
console.log('   2. Restart the server: npm run dev');
console.log('   3. Test in the web interface');
