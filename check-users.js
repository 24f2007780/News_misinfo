// Check existing users and test login
const mongoose = require('mongoose');
const User = require('./server/models/User');
const axios = require('axios');

async function checkUsers() {
  console.log('👥 Checking existing users and testing login...\n');

  try {
    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/misinformation-platform');
    console.log('✅ Connected to MongoDB');

    // List all users
    console.log('\n1. Existing users in database:');
    const users = await User.find({}, 'email name role credibilityScore').lean();
    
    if (users.length === 0) {
      console.log('❌ No users found in database!');
      console.log('💡 This explains why login is failing');
      return;
    }

    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.name}) - ${user.role} - Score: ${user.credibilityScore}`);
    });

    console.log(`\n📊 Total users: ${users.length}`);

    // Test login with admin account
    console.log('\n2. Testing login with admin account...');
    try {
      const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'admin@gmail.com',
        password: 'admin123'
      });
      
      console.log('✅ Admin login successful!');
      console.log('📊 Response:', {
        status: loginResponse.status,
        userId: loginResponse.data.user?.id,
        userName: loginResponse.data.user?.name,
        userRole: loginResponse.data.user?.role,
        tokenReceived: !!loginResponse.data.token
      });
    } catch (error) {
      console.log('❌ Admin login failed:', error.response?.data || error.message);
    }

    // Test login with rahul@gmail.com if it exists
    const rahulUser = users.find(u => u.email === 'rahul@gmail.com');
    if (rahulUser) {
      console.log('\n3. Testing login with rahul@gmail.com...');
      
      // Try common passwords
      const passwords = ['password123', 'admin123', '123456', 'password', 'rahul123'];
      
      for (const password of passwords) {
        try {
          const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'rahul@gmail.com',
            password: password
          });
          
          console.log(`✅ Login successful with password: ${password}`);
          console.log('📊 User details:', loginResponse.data.user);
          break;
        } catch (error) {
          console.log(`❌ Password '${password}' failed`);
        }
      }
    } else {
      console.log('\n3. rahul@gmail.com not found in database');
      console.log('💡 This explains why registration might work but login fails');
    }

    // Test server health
    console.log('\n4. Testing server health...');
    try {
      const healthResponse = await axios.get('http://localhost:5000/api/health');
      console.log('✅ Server is healthy:', healthResponse.data.status);
    } catch (error) {
      console.log('❌ Server health check failed:', error.message);
      console.log('💡 Make sure server is running on port 5000');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkUsers();
