import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFound';
import { checkDatabaseHealth } from './config/database';

const app: Express = express();

// Security middleware
app.use(helmet());

// CORS Configuration
// In production, this should be restricted to the specific origins of the Flutter app and PC software
app.use(cors({
  origin: '*', // FIXME: Restrict this in production
}));

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
  const isDbHealthy = await checkDatabaseHealth();
  
  if (isDbHealthy) {
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
      database: 'disconnected'
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
