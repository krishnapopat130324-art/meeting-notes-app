const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { connectDB } = require('./database-sqlite');
const routes = require('./routes');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('❌ Global Error:', err);
  
  if (err.type === 'validation') {
    return res.status(400).json({ 
      error: 'Validation Error', 
      message: err.message,
      details: err.details || null
    });
  }
  
  if (err.name === 'SyntaxError') {
    return res.status(400).json({ 
      error: 'Invalid JSON', 
      message: 'Please check your request format' 
    });
  }
  
  res.status(500).json({ 
    error: 'Internal Server Error', 
    message: 'Something went wrong. Please try again later.' 
  });
});

// Routes
app.use('/api', routes);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// WebSocket
io.on('connection', (socket) => {
  console.log('🟢 New client connected:', socket.id);

  socket.on('join-room', (roomId) => {
    if (!roomId) {
      socket.emit('error', { message: 'Room ID is required' });
      return;
    }
    socket.join(roomId);
    console.log(`Client ${socket.id} joined room: ${roomId}`);
  });

  socket.on('text-change', ({ roomId, content }) => {
    if (!roomId || !content) {
      socket.emit('error', { message: 'Room ID and content are required' });
      return;
    }
    socket.to(roomId).emit('text-update', content);
  });

  socket.on('cursor-move', ({ roomId, cursorData }) => {
    if (!roomId || !cursorData) {
      socket.emit('error', { message: 'Room ID and cursor data are required' });
      return;
    }
    socket.to(roomId).emit('cursor-update', cursorData);
  });

  socket.on('disconnect', () => {
    console.log('🔴 Client disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 Health Check: http://localhost:${PORT}/health`);
      console.log(`📡 API Endpoint: http://localhost:${PORT}/api/meetings`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM signal');
  server.close(() => {
    console.log('🛑 Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT signal');
  server.close(() => {
    console.log('🛑 Server closed');
    process.exit(0);
  });
});