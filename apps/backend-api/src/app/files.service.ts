import { PrismaClient } from '@prisma/client';
import { Multer } from 'multer';

const prisma = new PrismaClient();

export class FilesService {
  // Logic to create a file record in the database
  async createFile(file: Multer.File, userId: string) {
    const newFile = await prisma.file.create({
      data: {
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        fileData: file.buffer, // Store the file's binary data
        ownerId: userId,
      },
    });

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
    });

    // Ensure the file exists and the user is the owner
    if (!file || file.ownerId !== userId) {
      return null;
    }

    return file;
  }

  // Logic to delete a file record
  async deleteFile(fileId: string, userId: string) {
    // TODO: Implement file deletion
    console.log(`Deleting file ${fileId} for user ${userId}`);
    return { message: 'deleteFile not implemented' };
  }
}
