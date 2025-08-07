import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
const archiver = require('archiver');
import { Readable } from 'stream';

export class FileProcessorService {
  private readonly prisma: PrismaClient;
  private readonly redisSubscriber: Redis;
  private readonly redisPublisher: Redis;

  constructor() {
    this.prisma = new PrismaClient();
    // Assuming Redis is running on the default port.
    // In a real application, these would come from environment variables.
    this.redisSubscriber = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.redisPublisher = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    console.log('FileProcessorService initialized.');
  }

  public async start(): Promise<void> {
    console.log('Starting file processor worker...');
    // Subscribe to the channel where file upload notifications are published
    this.redisSubscriber.subscribe('file-uploaded', (err) => {
      if (err) {
        console.error('Failed to subscribe to file-uploaded channel', err);
        process.exit(1);
      }
      console.log('Subscribed to file-uploaded channel.');
    });

    this.redisSubscriber.on('message', (channel, message) => {
      if (channel === 'file-uploaded') {
        console.log(`Received message from ${channel}: ${message}`);
        this.processFile(message);
      }
    });
  }

  private async processFile(fileId: string): Promise<void> {
    try {
      // 1. Fetch the file record and update status to 'PROCESSING'
      const file = await this.prisma.file.update({
        where: { id: fileId },
        data: { status: 'PROCESSING' },
      });

      if (!file || !file.fileData) {
        console.error(`File with ID ${fileId} not found or has no data.`);
        return;
      }

      console.log(`Processing file: ${file.originalName} (ID: ${file.id})`);

      // 2. Compress the file data into a zip archive
      const zippedData = await this.zipBuffer(
        Buffer.from(file.fileData),
        file.originalName
      );

      // 3. Save the compressed data and update status to 'COMPLETED'
      await this.prisma.file.update({
        where: { id: fileId },
        data: {
          zippedData: { set: zippedData } as any,
          status: 'COMPLETED',
        },
      });

      console.log(`Successfully processed and compressed file: ${file.originalName}`);
    } catch (error) {
      console.error(`Error processing file ${fileId}:`, error);
      // 4. On error, update status to 'FAILED'
      await this.prisma.file.update({
        where: { id: fileId },
        data: { status: 'FAILED' },
      }).catch(err => console.error(`Failed to update status to FAILED for file ${fileId}`, err));
    }
  }

  private zipBuffer(buffer: Buffer, fileName: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const archive = archiver('zip', {
        zlib: { level: 9 }, // Set the compression level
      });

      const chunks: Buffer[] = [];

                  archive.on('data', (chunk) => {
        chunks.push(Buffer.from(chunk));
      });

      archive.on('end', () => {
        resolve(Buffer.concat(chunks as any));
      });

      archive.on('error', (err) => {
        reject(err);
      });

      // Create a readable stream from the buffer and append it to the archive
      const stream = Readable.from(buffer);
      archive.append(stream, { name: fileName });

      archive.finalize();
    });
  }
}
