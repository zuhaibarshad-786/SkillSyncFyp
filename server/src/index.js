// server/src/index.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');

const { initializeSocket } = require('./websocket');

// Load environment variables
dotenv.config();

// Config
const connectDB = require('./config/db');
const routes = require('./routes/index');
const { errorHandler } = require('./middleware/errorHandler');

// Express + Server
const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

// Connect DB
connectDB();

// --- SOCKET.IO INITIALIZATION (ONLY THIS!) ---
initializeSocket(server);

// --- Middleware ---
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// --- Routes ---
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Skill Exchange API is running!' });
});

app.use('/api', routes);
app.use(errorHandler);

// --- Start Server ---
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Client URL: ${process.env.CLIENT_URL}`);
});
