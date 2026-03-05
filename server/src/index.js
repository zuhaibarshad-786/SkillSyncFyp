// server/src/index.js
const express = require('express');
const dotenv  = require('dotenv');
const cors    = require('cors');
const helmet  = require('helmet');
const http    = require('http');

const { initializeSocket } = require('./websocket');

// Load environment variables
dotenv.config();

const connectDB        = require('./config/db');
const routes           = require('./routes/index');
const { errorHandler } = require('./middleware/errorHandler');

const app    = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

// ── Allowed origins ────────────────────────────────────────────────────────────
// Support multiple CLIENT_URL values (comma-separated) so you can allow
// both localhost and the Vercel deployment from one env var, e.g.:
//   CLIENT_URL=http://localhost:5173,https://your-app.vercel.app
const rawClientUrls = process.env.CLIENT_URL || 'http://localhost:5173';
const allowedOrigins = rawClientUrls
    .split(',')
    .map(u => u.trim())
    .filter(Boolean);

console.log('🌐 Allowed CORS origins:', allowedOrigins);

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS: origin "${origin}" not allowed`));
    },
    credentials: true,
};

// ── Connect DB ────────────────────────────────────────────────────────────────
connectDB();

// ── Socket.IO (must be initialized before routes) ─────────────────────────────
initializeSocket(server, corsOptions);

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Skill Exchange API is running!' });
});

app.use('/api', routes);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Client URL(s): ${allowedOrigins.join(', ')}`);
});