import { FileProcessorService } from './app/file.processor.service';

// This service will run as a standalone worker.
// It does not need to listen on any port for HTTP requests.

console.log('Initializing file processor...');

const fileProcessor = new FileProcessorService();

fileProcessor.start().catch((error) => {
  console.error('File processor failed to start:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down file processor...');
  // Here you would add any cleanup logic, like closing database connections
  process.exit(0);
});

