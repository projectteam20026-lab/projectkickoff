const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('❌ MONGO_URI is not defined in your .env file');
    process.exit(1);
  }

  if (uri.includes('localhost') || uri.includes('127.0.0.1')) {
    console.warn('⚠️  MONGO_URI points to localhost — make sure MongoDB is running locally,');
    console.warn('   or switch to a MongoDB Atlas URI (mongodb+srv://...)');
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);

    if (error.message.includes('ECONNREFUSED')) {
      console.error('   → No local MongoDB found. Use a MongoDB Atlas URI instead.');
    } else if (error.message.includes('bad auth') || error.message.includes('Authentication failed')) {
      console.error('   → Wrong username or password in your MONGO_URI.');
    } else if (error.message.includes('IP') || error.message.includes('whitelist')) {
      console.error('   → Your IP is not whitelisted. Add 0.0.0.0/0 in Atlas → Network Access.');
    } else if (error.message.includes('querySrv') || error.message.includes('ENOTFOUND')) {
      console.error('   → Cluster hostname not found. Check the URI copied from Atlas.');
    }

    process.exit(1);
  }
};

module.exports = connectDB;
