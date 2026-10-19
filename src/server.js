const app = require('./app');
const env = require('./config/env');
const prisma = require('./config/db');

const PORT = env.PORT || 5000;

const server = app.listen(PORT, async () => {
  console.log(`=========================================`);
  console.log(` Healthcare Management Backend API`);
  console.log(` Server listening on port: ${PORT}`);
  console.log(` Environment: ${env.NODE_ENV}`);
  console.log(` Health check: http://localhost:${PORT}/api/health`);
  console.log(`=========================================`);

  try {
    await prisma.$connect();
    console.log(' Successfully connected to PostgreSQL via Prisma.');
  } catch (error) {
    console.error(' Database connection failed on startup:');
    console.error(`   ${error.message}`);
    console.error('   Please ensure PostgreSQL is running and DATABASE_URL in .env is correct.');
  }
});

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    try {
      await prisma.$disconnect();
      console.log(' Database disconnected.');
    } catch (err) {
      console.error(' Error during database disconnection:', err.message);
    }
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = server;
