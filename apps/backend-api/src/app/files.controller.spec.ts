import express, { json } from 'express';
import type { Request, Response, NextFunction } from 'express';
import request from 'supertest';

// Minimal shape for uploaded file used in tests
interface MockUploadedFile {
  originalname: string;
  size: number;
  mimetype: string;
  buffer: Buffer;
}

// Mock multer with default export and memoryStorage
jest.mock('multer', () => {
  const __singleMock = jest.fn().mockReturnValue((req: Request, _res: Response, next: NextFunction) => next());
  const fn = jest.fn(() => ({ single: __singleMock }));
  (fn as any).memoryStorage = jest.fn(() => ({}));
  return { __esModule: true, default: fn, __singleMock };
});

const createFileMock = jest.fn();
const listFilesMock = jest.fn();
const getFileMock = jest.fn();
const deleteFileMock = jest.fn();
const renameFileMock = jest.fn();

jest.mock('./files.service', () => {
  class FilesService {
    createFile(file: MockUploadedFile, userId: string) { return createFileMock(file, userId); }
    listFiles(userId: string) { return listFilesMock(userId); }
    getFile(id: string, userId: string) { return getFileMock(id, userId); }
    deleteFile(id: string, userId: string) { return deleteFileMock(id, userId); }
    renameFile(id: string, userId: string, newName: string) { return renameFileMock(id, userId, newName); }
  }
  return { FilesService };
});

const authMiddlewareMock = jest.fn((_req: Request, _res: Response, next: NextFunction) => next());
jest.mock('./auth.middleware', () => ({
  authMiddleware: (req: Request, res: Response, next: NextFunction) => authMiddlewareMock(req, res, next),
}));

import { FilesController } from './files.controller';

describe('FilesController', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(json());
    app.use((req, _res, next) => {
      (req as any).user = { userId: 'u1' };
      next();
    });
    app.use('/api/files', FilesController);

    createFileMock.mockReset();
    listFilesMock.mockReset();
    getFileMock.mockReset();
    deleteFileMock.mockReset();
    renameFileMock.mockReset();
  });

  it('POST /upload -> 400 if no file', async () => {
    const res = await request(app).post('/api/files/upload');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: 'No file uploaded.' });
  });

  it('POST /upload -> 201 on success', async () => {
    // Because the multer single() middleware is bound at controller import time,
    // we inject req.file via a pre-middleware before the router for this test.
    const app2 = express();
    app2.use(json());
    app2.use((req, _res, next) => {
      (req as any).user = { userId: 'u1' };
      next();
    });
    app2.use('/api/files', (req: Request, _res: Response, next: NextFunction) => {
      if (req.method === 'POST' && req.path === '/upload') {
        (req as any).file = { originalname: 'a', size: 1, mimetype: 't', buffer: Buffer.from('x') } as MockUploadedFile;
      }
      next();
    }, FilesController);

    createFileMock.mockResolvedValue({ id: 'f1' });
    const res = await request(app2).post('/api/files/upload');
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 'f1' });
  });

  it('GET / -> 200 list files', async () => {
    listFilesMock.mockResolvedValue([{ id: 'f1' }]);
    const res = await request(app).get('/api/files');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 'f1' }]);
  });

  it('GET /:id -> 404 when not found', async () => {
    getFileMock.mockResolvedValue(null);
    const res = await request(app).get('/api/files/f1');
    expect(res.status).toBe(404);
  });

  it('GET /:id -> 202 when processing', async () => {
    getFileMock.mockResolvedValue({ id: 'f1', status: 'PROCESSING', originalName: 'a', zippedData: null, mimeType: 't' });
    const res = await request(app).get('/api/files/f1');
    expect(res.status).toBe(202);
  });

  it('GET /:id -> 500 when failed', async () => {
    getFileMock.mockResolvedValue({ id: 'f1', status: 'FAILED', originalName: 'a', zippedData: null, mimeType: 't' });
    const res = await request(app).get('/api/files/f1');
    expect(res.status).toBe(500);
  });

  it('GET /:id -> 200 with zip when completed', async () => {
    const zip = Buffer.from('zip');
    getFileMock.mockResolvedValue({ id: 'f1', status: 'COMPLETED', originalName: 'a', zippedData: zip, mimeType: 'application/zip' });
    const res = await request(app)
      .get('/api/files/f1')
      .buffer(true)
      .parse((res, cb) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        // Cast to any to satisfy TS types for Buffer.concat in our node typings
        res.on('end', () => cb(null, Buffer.concat(chunks as any)));
      });
    expect(res.status).toBe(200);
    expect(res.header['content-type']).toBe('application/zip');
    expect(res.header['content-disposition']).toContain('a.zip');
    expect(res.body).toEqual(zip);
  });

  it('DELETE /:id -> 404 when not found', async () => {
    deleteFileMock.mockResolvedValue(null);
    const res = await request(app).delete('/api/files/f1');
    expect(res.status).toBe(404);
  });

  it('DELETE /:id -> 204 when deleted', async () => {
    deleteFileMock.mockResolvedValue({ success: true });
    const res = await request(app).delete('/api/files/f1');
    expect(res.status).toBe(204);
  });

  it('PATCH /:id/rename -> 400 if missing name', async () => {
    const res = await request(app).patch('/api/files/f1/rename').send({});
    expect(res.status).toBe(400);
  });

  it('PATCH /:id/rename -> 404 when not found', async () => {
    renameFileMock.mockResolvedValue(null);
    const res = await request(app).patch('/api/files/f1/rename').send({ newName: 'b' });
    expect(res.status).toBe(404);
  });

  it('PATCH /:id/rename -> 200 on success', async () => {
    renameFileMock.mockResolvedValue({ id: 'f1', originalName: 'b' });
    const res = await request(app).patch('/api/files/f1/rename').send({ newName: 'b' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 'f1', originalName: 'b' });
  });
});
