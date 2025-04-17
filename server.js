require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const sequelize = require('./config/database');

// Import models
const User = require('./models/User');
const Class = require('./models/Class');
const Poll = require('./models/Poll');
const PollResponse = require('./models/PollResponse');
const ClassStudents = require('./models/ClassStudents');

// Import routes
const authRoutes = require('./routes/auth');
const classRoutes = require('./routes/classes');
const pollRoutes = require('./routes/polls');

const app = express();
const server = http.createServer(app);

// Configure CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Allow any origin that sends a request
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Middleware
app.use(express.json());

// Socket.io configuration
const io = socketIo(server, {
  cors: {
    origin: true, // Allow any origin
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }
});

// Add Socket.IO to request object
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/polls', pollRoutes);

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Create an object with all models
const models = {
  User,
  Class,
  Poll,
  PollResponse,
  ClassStudents
};

// Initialize all model associations
Object.values(models).forEach((model) => {
  if (model.associate) {
    model.associate(models);
  }
});

// Database synchronization
sequelize.sync({ alter: false })
  .then(() => {
    console.log('Database synchronized');
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Error synchronizing database:', err);
  }); 