import app from './app';
import { env } from './config/env';
import pool, { checkDatabaseHealth } from './config/database';
import { ensureSchema } from './scripts/ensureSchema';

const startServer = () => {
  try {
    // Bind HTTP port immediately so cloud platforms (Render) detect the open port in <1s
    const server = app.listen(env.PORT, '0.0.0.0', () => {
      console.log(`🚀 Server is running on http://0.0.0.0:${env.PORT} in ${env.NODE_ENV} mode.`);
    });

    // Initialize Socket.io on the bound HTTP server
    const { initializeSocket } = require('./socket');
    initializeSocket(server);

    // Run database health & idempotent schema verification in the background without blocking startup
    void (async () => {
      try {
        const dbHealth = await checkDatabaseHealth();
        if (dbHealth.healthy) {
          console.log('✅ Successfully connected to the database.');
          await ensureSchema();
        } else {
          console.warn('⚠️ WARNING: Database connection check failed during startup:', dbHealth.error);
        }
      } catch (dbErr) {
        console.error('⚠️ Startup schema check error:', dbErr);
      }
    })();

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
