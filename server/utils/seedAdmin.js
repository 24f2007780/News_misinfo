const User = require('../models/User');

/**
 * Seeds a default admin account if it doesn't exist
 * Email: admin@gmail.com
 * Password: admin123
 */
async function seedDefaultAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@gmail.com' });
    
    if (existingAdmin) {
      console.log('✅ Default admin account already exists');
      return;
    }

    // Create default admin account
    const adminUser = new User({
      email: 'admin@gmail.com',
      password: 'admin123',
      name: 'Administrator',
      role: 'admin',
      credibilityScore: 100,
      level: 'expert'
    });

    await adminUser.save();
    console.log('✅ Default admin account created successfully');
    console.log('   Email: admin@gmail.com');
    console.log('   Password: admin123');
    console.log('   ⚠️  Please change the password after first login!');
  } catch (error) {
    console.error('❌ Error seeding default admin:', error.message);
  }
}

module.exports = seedDefaultAdmin;
