import app from './app';
import { env } from './config/env';
import pool, { checkDatabaseHealth } from './config/database';

const startServer = async () => {
  try {
    // Optional: Check database connection before fully starting up
    const isDbConnected = await checkDatabaseHealth();
    if (isDbConnected) {
      console.log('✅ Successfully connected to the database.');
    } else {
      console.warn('⚠️ WARNING: Database connection failed during startup.');
    }

    // Start listening on all network interfaces
    const server = app.listen(env.PORT, '0.0.0.0', () => {
      console.log(`🚀 Server is running on http://0.0.0.0:${env.PORT} in ${env.NODE_ENV} mode.`);
    });

    // Initialize Socket.io
    const { initializeSocket } = require('./socket');
    initializeSocket(server);

    // Handle graceful shutdown
    const shutdown = async () => {
      console.log('Shutting down gracefully...');
      server.close(async () => {
        console.log('HTTP server closed.');
        await pool.end();
        console.log('Database pool closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('❌ Failed to start the server:', error);
    process.exit(1);
  }
};

startServer();
