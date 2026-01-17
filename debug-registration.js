// Debug registration issue
const axios = require('axios');

async function debugRegistration() {
  console.log('🔍 Debugging registration issue...\n');

  // Test 1: Check if server is responding
  try {
    console.log('1. Testing server health...');
    const healthResponse = await axios.get('http://localhost:5000/api/health');
    console.log('✅ Server is responding:', healthResponse.status);
  } catch (error) {
    console.log('❌ Server not responding:', error.message);
    console.log('💡 Make sure server is running with: npm run dev');
    return;
  }

  // Test 2: Test registration with the exact data from the form
  try {
    console.log('\n2. Testing registration with form data...');
    
    const formData = {
      name: 'rahul',
      email: 'rahul@gmail.com',
      password: '••••••••' // This might be the issue - let's use a real password
    };

    console.log('📝 Attempting registration with:', {
      name: formData.name,
      email: formData.email,
      passwordLength: formData.password.length,
      passwordActual: formData.password
    });

    // The password field shows dots, but let's try with a real password
    const testData = {
      name: 'rahul',
      email: 'rahul@gmail.com',
      password: 'password123' // Use a real password instead of dots
    };

    const response = await axios.post('http://localhost:5000/api/auth/register', testData);
    console.log('✅ Registration successful!');
    console.log('User created:', response.data.user);

  } catch (error) {
    console.log('❌ Registration failed:', error.response?.data || error.message);
    
    if (error.response?.data?.error) {
      console.log('\n🔍 Specific error:', error.response.data.error);
      
      if (error.response.data.error.includes('already exists')) {
        console.log('💡 Try with a different email address');
      } else if (error.response.data.error.includes('required')) {
        console.log('💡 Make sure all fields are filled');
      } else if (error.response.data.error.includes('password')) {
        console.log('💡 Password must be at least 6 characters');
      }
    }
  }

  // Test 3: Check if the issue is with the existing email
  try {
    console.log('\n3. Testing with a unique email...');
    
    const uniqueData = {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'password123'
    };

    const response = await axios.post('http://localhost:5000/api/auth/register', uniqueData);
    console.log('✅ Registration with unique email successful!');
    console.log('💡 The issue might be that rahul@gmail.com already exists');

  } catch (error) {
    console.log('❌ Even unique email failed:', error.response?.data || error.message);
  }

  // Test 4: Check existing users
  try {
    console.log('\n4. Checking if rahul@gmail.com already exists...');
    
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'rahul@gmail.com',
      password: 'password123' // Try common passwords
    });
    
    console.log('✅ User rahul@gmail.com already exists and can login!');
    console.log('💡 This explains why registration failed - user already exists');
    
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('⚠️ User rahul@gmail.com exists but password is different');
      console.log('💡 Try logging in with the correct password or use a different email');
    } else {
      console.log('❌ Login test failed:', error.response?.data || error.message);
    }
  }

  console.log('\n📋 Summary:');
  console.log('- If rahul@gmail.com already exists, use a different email');
  console.log('- Make sure password is at least 6 characters');
  console.log('- Check server console logs for detailed error messages');
  console.log('- Try clearing browser cache and cookies');
}

debugRegistration();
