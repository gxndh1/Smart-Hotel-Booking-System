import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config()
export const connectDB = async () => {
  try {
    if (!process.env.MONGO_URL) {
      throw new Error("MONGO_URL is not defined in .env file");
    }
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Database has been connected!!");

    try {
      const userColl = mongoose.connection.collection('users');
      
      // Drop legacy PascalCase index if it exists
      await userColl.dropIndex('Email_1').catch(() => {});
      
      // Migrate any PascalCase 'Email' fields back to camelCase 'email'
      await userColl.updateMany(
        { email: { $exists: false }, Email: { $exists: true, $ne: null } },
        [{ $set: { email: '$Email' } }]
      );

      // Ensure unique index on camelCase 'email'
      await userColl.createIndex({ email: 1 }, { unique: true });
    } catch (indexErr) {
      console.error('Error migrating user email index:', indexErr.message);
    }
  } catch (err) {
    console.error("Database connection error:", err.message);
    process.exit(1);
  }
};
