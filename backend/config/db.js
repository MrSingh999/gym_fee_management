import mongoose from 'mongoose';
import Admin from '../models/Admin.js';
import Plan from '../models/Plan.js';
import Member from '../models/Member.js';

const connectDB = async () => {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gym_dashboard';
  console.log('Connecting to MongoDB...');
  
  try {
    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`Connected to MongoDB database successfully: ${conn.connection.host}`);

    // Seed default admin user if Admin collection is empty
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      console.log('No admins found in database. Seeding default system admin...');
      await Admin.create({
        name: 'System Admin',
        email: 'admin@admin.com',
        password: 'admin123', // This will be hashed automatically by pre-save Admin hook
        role: 'admin',
      });
      console.log('Default system admin seeded successfully: admin@admin.com / admin123');
    }

    // Seed default plans if Plan collection is empty
    const planCount = await Plan.countDocuments();
    if (planCount === 0) {
      console.log('No plans found in database. Seeding default plans...');
      await Plan.create([
        { name: 'workout', price: 700, durationDays: 30, description: 'Standard Workout Plan' },
        { name: 'workout + cardio', price: 1000, durationDays: 30, description: 'Cardio & Workout Combo' }
      ]);
      console.log('Default plans seeded successfully!');
    }

    // Migrate legacy members without plan references
    const legacyMembersCount = await Member.countDocuments({ plan: { $exists: false } });
    if (legacyMembersCount > 0) {
      console.log(`Found ${legacyMembersCount} legacy members requiring plan reference migration...`);
      const plans = await Plan.find();
      const workoutPlan = plans.find(p => p.name.toLowerCase() === 'workout');
      const comboPlan = plans.find(p => p.name.toLowerCase() === 'workout + cardio');

      const legacyMembers = await Member.find({ plan: { $exists: false } });
      let migratedCount = 0;
      for (const member of legacyMembers) {
        const rawDoc = member.toObject();
        
        const phoneVal = rawDoc.phone || rawDoc.mobile;
        const startVal = rawDoc.startDate || rawDoc.feeStartDate;
        const endVal = rawDoc.endDate || rawDoc.feeEndDate;

        let statusVal = 'Active';
        if (rawDoc.status) {
          const statusLower = rawDoc.status.toLowerCase();
          if (statusLower === 'inactive') {
            statusVal = 'Inactive';
          } else if (statusLower === 'overdue' || statusLower === 'expired') {
            statusVal = 'Expired';
          }
        }

        let planId = plans[0] ? plans[0]._id : null;
        const type = (rawDoc.membershipType || '').toLowerCase();
        if (type.includes('cardio') && comboPlan) {
          planId = comboPlan._id;
        } else if (workoutPlan) {
          planId = workoutPlan._id;
        }

        if (planId && phoneVal && startVal && endVal) {
          await Member.updateOne(
            { _id: member._id },
            {
              $set: {
                mobile: phoneVal,
                feeStartDate: startVal,
                feeEndDate: endVal,
                status: statusVal,
                plan: planId
              },
              $unset: {
                phone: "",
                startDate: "",
                endDate: "",
                membershipType: "",
                feeAmount: ""
              }
            }
          );
          migratedCount++;
        }
      }
      console.log(`Successfully migrated ${migratedCount} legacy members to the normalized plan relationship!`);
    }
  } catch (error) {
    console.error(`MongoDB database connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
