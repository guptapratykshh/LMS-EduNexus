const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'https://edunexus-frontend-owtp.onrender.com',
  'https://edunexus-frontend.onrender.com',
  'https://edunexus-lms.onrender.com',
  'https://edunexus-frontend-fvyc.onrender.com'
];

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const assignmentRoutes = require('./routes/assignments');
const chatRoutes = require('./routes/chat');
const userRoutes = require('./routes/users');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);
app.use('/api/live', require('./routes/live'));

// Socket.io for real-time chat and live sessions
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_room', (courseId) => {
    socket.join(courseId);
    console.log(`User ${socket.id} joined room ${courseId}`);
  });

  socket.on('send_message', (data) => {
    console.log('Broadcasting message to room:', data.courseId);
    // Broadcast to all in the room including sender
    io.to(data.courseId).emit('receive_message', {
      text: data.text,
      sender: data.sender,
      senderName: data.senderName,
      timestamp: data.timestamp
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });

  // Live session signaling
  socket.on('live:join', ({ roomCode, userId, name }) => {
    socket.join(roomCode);
    io.to(roomCode).emit('live:peer:join', { userId, name });
  });

  // Relay SDP/ICE between peers within the room
  socket.on('live:signal', ({ roomCode, to, from, data }) => {
    io.to(roomCode).emit('live:signal', { to, from, data });
  });

  socket.on('live:leave', ({ roomCode, userId }) => {
    socket.leave(roomCode);
    io.to(roomCode).emit('live:peer:leave', { userId });
  });
});

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://aryansingh:aryanmongodb@cluster0.7shqalg.mongodb.net/edunexus';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Make io available globally for chat routes
global.io = io;

// Export for use in routes
module.exports = httpServer;

