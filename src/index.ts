import dotenv from 'dotenv';
import { observability } from './setup/Observability';
import { Server } from './setup';

dotenv.config();

let server: Server;

async function main() {
  server = new Server();
  await server.start();
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

let isShuttingDown = false;

async function gracefulShutdown() {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;

  try {
    if (server) {
      await server.shutdown();
    }
    await observability.shutdown();
  } catch (error) {
    console.error('Error during shutdown:', error);
  } finally {
    process.exit(0);
  }
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
