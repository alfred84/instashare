import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';


const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export class FilesService {
  // Logic to rename a file
  async renameFile(fileId: string, userId: string, newName: string) {
    const file = await prisma.file.findUnique({
      where: { id: fileId, ownerId: userId },
    });

    // If no file is found for that user, return null
    if (!file) {
      return null;
    }

    // If the file is found and owned by the user, update its name
    const updatedFile = await prisma.file.update({
      where: { id: fileId },
      data: { originalName: newName },
    });

    // We don't return the fileData to avoid sending large binary data back
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { fileData, ...result } = updatedFile;
    return result;
  }

  // Logic to create a file record in the database
  async createFile(file: Express.Multer.File, userId: string) {
    const newFile = await prisma.file.create({
      data: {
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        fileData: file.buffer, // Store the file's binary data
        ownerId: userId,
      },
    });

    // Publish a message to the 'file-uploaded' channel with the new file's ID
    if (newFile) {
      await redis.publish('file-uploaded', newFile.id);
    }

    // We don't return the fileData to avoid sending large binary data back
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { fileData, ...result } = newFile;
    return result;
  }

  // Logic to list files for a user
  async listFiles(userId: string) {
    return prisma.file.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        originalName: true,
        status: true,
        size: true,
        mimeType: true,
        createdAt: true,
      },
    });
  }

  // Logic to get a single file for download
  async getFile(fileId: string, userId: string) {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      select: {
        id: true,
        originalName: true,
        status: true,
        mimeType: true,
        fileData: true,
        zippedData: true,
        ownerId: true,
      },
    });

    // Ensure the file exists and the user is the owner
    if (!file || file.ownerId !== userId) {
      return null;
    }

    return file;
  }

  // Logic to delete a file record
  async deleteFile(fileId: string, userId: string) {
    const file = await prisma.file.findUnique({
      where: { id: fileId, ownerId: userId },
    });

    // If no file is found for that user, return null
    if (!file) {
      return null;
    }

    // If the file is found and owned by the user, delete it
    await prisma.file.delete({
      where: { id: fileId },
    });

    return { success: true };
  }
}
