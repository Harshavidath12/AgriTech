const mongoose = require('mongoose');

/**
 * Establishes a connection to MongoDB Atlas.
 * Uses the MONGO_URI environment variable.
 */
const connectDB = async () => {
  try {
    // Mongoose 9+ removed useNewUrlParser and useUnifiedTopology — no options needed
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
