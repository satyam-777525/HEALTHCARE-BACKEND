const { PrismaClient } = require('@prisma/client');

// Singleton PrismaClient instance
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
});

module.exports = prisma;
