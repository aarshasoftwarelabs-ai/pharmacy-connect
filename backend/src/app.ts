import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFound';
import { checkDatabaseHealth } from './config/database';
import { env } from './config/env';
import rateLimit from 'express-rate-limit';

const app: Express = express();

// Security middleware
app.use(helmet());

// CORS Configuration
const allowedOrigins = env.CORS_ORIGINS ? env.CORS_ORIGINS.split(',') : '*';

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per `window`
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', apiLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'PharmacyConnect API is running'
  });
});

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  const dbStatus = await checkDatabaseHealth();
  
  if (dbStatus.healthy) {
    res.status(200).json({
      success: true,
      service: 'pharmacyconnect-api',
      status: 'healthy',
      database: 'connected'
    });
  } else {
    res.status(503).json({
      success: false,
      service: 'pharmacyconnect-api',
      status: 'degraded',
      database: 'disconnected',
      error: dbStatus.error
    });
  }
});

// API Routes
app.use('/api', routes);

// 404 Handler for undefined routes
app.use(notFoundHandler);

// Centralized Error Handler
app.use(errorHandler);

export default app;
