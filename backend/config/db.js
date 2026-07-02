import mongoose from 'mongoose';
import User from '../models/User.js';

const connectDB = async () => {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gym_dashboard';
  console.log('Connecting to MongoDB...');
  
  try {
    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`Connected to MongoDB database successfully: ${conn.connection.host}`);

    // Seed default admin user if user collection is empty
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('No users found in database. Seeding default system admin...');
      await User.create({
        name: 'System Admin',
        email: 'admin@admin.com',
        password: 'admin123', // This will be hashed automatically by pre-save User hook
        role: 'admin',
      });
      console.log('Default system admin seeded successfully: admin@apexfit.com / AdminApex12!');
    }
  } catch (error) {
    console.error(`MongoDB database connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
