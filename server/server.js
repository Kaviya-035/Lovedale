// Lovedale Server - Main Entry Point
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const crypto = require('crypto');
const connectDB = require('./config/db');
const { initializeSocket } = require('./sockets/socketHandler');

// Load environment variables
dotenv.config();

// Auto-generate JWT_SECRET if not set
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = crypto.randomBytes(64).toString('hex');
  console.log('⚠️  JWT_SECRET not set in .env — generated a random secret.');
  console.log('   Set JWT_SECRET in .env for persistent sessions across restarts.\n');
}

// Initialize Express
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow Vercel frontend, any localhost, or no origin
      const allowed = [
        process.env.CLIENT_URL,
        /^https?:\/\/.*\.vercel\.app$/,
        /^https?:\/\/localhost:\d+$/,
      ];
      if (!origin) return callback(null, true);
      const ok = allowed.some(p =>
        typeof p === 'string' ? p === origin : p.test(origin)
      );
      callback(ok ? null : new Error('Not allowed by CORS'), ok);
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      process.env.CLIENT_URL,
      /^https?:\/\/.*\.vercel\.app$/,
      /^https?:\/\/localhost:\d+$/,
    ];
    if (!origin) return callback(null, true);
    const ok = allowed.some(p =>
      typeof p === 'string' ? p === origin : p.test(origin)
    );
    callback(ok ? null : new Error('Not allowed by CORS'), ok);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/memories', require('./routes/memoryRoutes'));
app.use('/api/status',   require('./routes/statusRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  const dbState = require('mongoose').connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  res.json({ 
    status: 'ok', 
    message: '💘 Lovedale server is running',
    database: states[dbState] || 'unknown'
  });
});


// Initialize Socket handlers
initializeSocket(io);

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

console.log('🚀 Starting Lovedale server...');
console.log('📡 Connecting to MongoDB...');
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`\n💘 Lovedale server running on port ${PORT}`);
    console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
    console.log(`📡 Socket.io ready\n`);
  });
});
