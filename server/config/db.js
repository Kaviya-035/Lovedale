const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s
    });
    console.log(`💘 MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    
    if (error.message.includes('ETIMEDOUT') || error.message.includes('serverSelectionTimeoutMS')) {
      console.log('\n🚨 NETWORK ALERT: Port 27017 seems to be blocked on your network.');
      console.log('💡 TIP: If you are using a Mobile Hotspot, many ISPs block port 27017.');
      console.log('👉 Try: Switch to a Home Wi-Fi or use a VPN.');
    }
    
    console.log('💡 TIP: If you are using MongoDB Atlas, make sure your IP is whitelisted (0.0.0.0/0 for all IPs).');
    process.exit(1);
  }
};

module.exports = connectDB;
