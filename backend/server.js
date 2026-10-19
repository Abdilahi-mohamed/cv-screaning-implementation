require('dotenv').config();
const net = require('net');
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { openRouterConfigured, openRouterModel } = require('./services/openRouterService');

const app = express();
const preferredPort = Number(process.env.PORT) || 5000;
let actualPort = preferredPort;
const isLocalOrigin = (origin) => {
  if (!origin) return true;

  try {
    const { hostname, port } = new URL(origin);
    const isLocalHost = ['localhost', '127.0.0.1', '0.0.0.0'].includes(hostname);
    return isLocalHost && (port === '' || /^\d+$/.test(port));
  } catch (error) {
    return false;
  }
};
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://127.0.0.1:3000',
  'http://localhost:3000',
  'http://127.0.0.1:4173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5174',
  'http://localhost:5174',
  'http://127.0.0.1:5175',
  'http://localhost:5175',
].filter(Boolean);

const getAvailablePort = (port) => new Promise((resolve, reject) => {
  const tester = net.createServer();

  tester.once('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      resolve(getAvailablePort(port + 1));
      return;
    }
    reject(error);
  });

  tester.once('listening', () => {
    tester.close(() => resolve(port));
  });

  tester.listen(port, '127.0.0.1');
});

const listenOnPort = (port) => new Promise((resolve, reject) => {
  const server = app.listen(port, '0.0.0.0', () => {
    actualPort = server.address().port;
    resolve(server);
  });

  server.on('error', async (error) => {
    if (error.code === 'EADDRINUSE') {
      const nextPort = port + 1;
      console.log(`Port ${port} is busy. Retrying on ${nextPort}...`);
      resolve(listenOnPort(nextPort));
      return;
    }
    reject(error);
  });
});

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || isLocalOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/jobs', require('./routes/dashboardRoutes'));
app.use('/api/cvs', require('./routes/cvRoutes'));
app.use('/api/evaluations', require('./routes/evaluationRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));

app.get('/api/health', (req, res) => {
  res.json({
    message: 'CV Evolution API is running',
    status: 'ok',
    port: actualPort,
    integrations: {
      openrouter: {
        configured: openRouterConfigured,
        model: openRouterModel,
      },
    },
  });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    const server = await listenOnPort(preferredPort);
    const startedPort = server.address().port;
    actualPort = startedPort;
    console.log(`Server running on http://localhost:${startedPort}`);
  } catch (error) {
    console.error('Unable to start server:', error.message);
    process.exit(1);
  }
};

startServer();
