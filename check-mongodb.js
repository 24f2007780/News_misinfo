// Check MongoDB connection status
const mongoose = require('mongoose');

async function checkMongoDB() {
  console.log('🔍 Checking MongoDB connection...\n');

  try {
    // Try to connect
    console.log('1. Attempting to connect to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/misinformation-platform', {
      serverSelectionTimeoutMS: 5000 // 5 second timeout
    });

    console.log('✅ MongoDB connection successful!');
    console.log('📊 Connection details:');
    console.log(`   - Host: ${mongoose.connection.host}`);
    console.log(`   - Port: ${mongoose.connection.port}`);
    console.log(`   - Database: ${mongoose.connection.name}`);
    console.log(`   - Ready State: ${mongoose.connection.readyState} (1 = connected)`);

    // Test basic operations
    console.log('\n2. Testing database operations...');
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`✅ Found ${collections.length} collections:`, collections.map(c => c.name).join(', '));

    // Test user operations
    const User = require('./server/models/User');
    const userCount = await User.countDocuments();
    console.log(`✅ Users collection: ${userCount} users found`);

    if (userCount === 0) {
      console.log('⚠️ No users found - this might be why login is failing');
      console.log('💡 The server should create a default admin user on startup');
    }

    console.log('\n🎉 MongoDB is working correctly!');
    console.log('💡 The login issue might be something else. Check:');
    console.log('   - Server console logs for specific errors');
    console.log('   - Browser network tab for failed requests');
    console.log('   - Try the admin account: admin@gmail.com / admin123');

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n🔧 MongoDB is not running. Solutions:');
      console.log('1. Start MongoDB service:');
      console.log('   - Windows: net start MongoDB (as administrator)');
      console.log('   - Or: mongod (if installed manually)');
      console.log('');
      console.log('2. Install MongoDB Community Server:');
      console.log('   - Download from: https://www.mongodb.com/try/download/community');
      console.log('   - Install with default settings');
      console.log('');
      console.log('3. Use MongoDB Atlas (cloud):');
      console.log('   - Sign up at: https://www.mongodb.com/atlas');
      console.log('   - Create free cluster');
      console.log('   - Update MONGODB_URI in .env file');
    } else if (error.message.includes('authentication')) {
      console.log('\n🔧 MongoDB authentication issue:');
      console.log('- Check username/password in connection string');
      console.log('- Make sure MongoDB auth is configured correctly');
    } else {
      console.log('\n🔧 Other MongoDB issues:');
      console.log('- Check if MongoDB is installed');
      console.log('- Verify connection string format');
      console.log('- Check firewall/network settings');
    }
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('\n🔌 Disconnected from MongoDB');
    }
  }
}

checkMongoDB();
