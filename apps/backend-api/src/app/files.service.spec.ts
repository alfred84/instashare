import { FilesService } from './files.service';

// Prisma mock with internal functions exported for test access
jest.mock('@prisma/client', () => {
  const prismaFindUnique = jest.fn();
  const prismaUpdate = jest.fn();
  const prismaCreate = jest.fn();
  const prismaFindMany = jest.fn();
  const prismaDelete = jest.fn();
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      file: {
        findUnique: prismaFindUnique,
        update: prismaUpdate,
        create: prismaCreate,
        findMany: prismaFindMany,
        delete: prismaDelete,
      },
    })),
    __prismaFindUnique: prismaFindUnique,
    __prismaUpdate: prismaUpdate,
    __prismaCreate: prismaCreate,
    __prismaFindMany: prismaFindMany,
    __prismaDelete: prismaDelete,
  };
});

// ioredis mock with exported publish mock
jest.mock('ioredis', () => {
  const publishMock = jest.fn();
  const subscribeMock = jest.fn();
  const onMock = jest.fn();
  const Redis = jest.fn().mockImplementation(() => ({
    publish: (...args: any[]) => (publishMock as any)(...args),
    subscribe: (...args: any[]) => (subscribeMock as any)(...args),
    on: (...args: any[]) => (onMock as any)(...args),
  }));
  return Object.assign(Redis, {
    __publishMock: publishMock,
    __subscribeMock: subscribeMock,
    __onMock: onMock,
  });
});

const { __prismaFindUnique: prismaFindUnique, __prismaUpdate: prismaUpdate, __prismaCreate: prismaCreate, __prismaFindMany: prismaFindMany, __prismaDelete: prismaDelete } = require('@prisma/client');
const { __publishMock: publishMock } = require('ioredis');

describe('FilesService', () => {
  let service: FilesService;

  beforeEach(() => {
    service = new FilesService();
    prismaFindUnique.mockReset();
    prismaUpdate.mockReset();
    prismaCreate.mockReset();
    prismaFindMany.mockReset();
    prismaDelete.mockReset();
    publishMock.mockReset();
  });

  it('renameFile returns null when file not found', async () => {
    prismaFindUnique.mockResolvedValue(null);
    const res = await service.renameFile('f1', 'u1', 'new');
    expect(res).toBeNull();
  });

  it('renameFile updates and omits fileData', async () => {
    prismaFindUnique.mockResolvedValue({ id: 'f1', ownerId: 'u1' });
    prismaUpdate.mockResolvedValue({
      id: 'f1',
      ownerId: 'u1',
      originalName: 'new',
      fileData: Buffer.from('x'),
    });
    const res = await service.renameFile('f1', 'u1', 'new');
    expect(prismaUpdate).toHaveBeenCalled();
    expect(res).toEqual({ id: 'f1', ownerId: 'u1', originalName: 'new' });
    expect((res as any).fileData).toBeUndefined();
  });

  it('createFile creates record, publishes message, and omits fileData', async () => {
    prismaCreate.mockResolvedValue({
      id: 'f1',
      originalName: 'a.txt',
      size: 3,
      mimeType: 'text/plain',
      fileData: Buffer.from('abc'),
      ownerId: 'u1',
    });

    const file = {
      originalname: 'a.txt',
      size: 3,
      mimetype: 'text/plain',
      buffer: Buffer.from('abc'),
    } as any;

    const res = await service.createFile(file, 'u1');
    expect(prismaCreate).toHaveBeenCalled();
    expect(publishMock).toHaveBeenCalledWith('file-uploaded', 'f1');
    expect(res).toEqual({
      id: 'f1', originalName: 'a.txt', size: 3, mimeType: 'text/plain', ownerId: 'u1'
    });
  });

  it('listFiles returns results', async () => {
    const rows = [{ id: 'f1' }, { id: 'f2' }];
    prismaFindMany.mockResolvedValue(rows);
    const res = await service.listFiles('u1');
    expect(res).toBe(rows);
  });

  it('getFile returns null when not found or not owner', async () => {
    prismaFindUnique.mockResolvedValue(null);
    let res = await service.getFile('f1', 'u1');
    expect(res).toBeNull();

    prismaFindUnique.mockResolvedValue({ id: 'f1', ownerId: 'other' });
    res = await service.getFile('f1', 'u1');
    expect(res).toBeNull();
  });

  it('getFile returns file when owner matches', async () => {
    const file = { id: 'f1', ownerId: 'u1', fileData: Buffer.from('x'), status: 'UPLOADED', originalName: 'a', mimeType: 't' };
    prismaFindUnique.mockResolvedValue(file);
    const res = await service.getFile('f1', 'u1');
    expect(res).toBe(file);
  });

  it('deleteFile returns null when not found', async () => {
    prismaFindUnique.mockResolvedValue(null);
    const res = await service.deleteFile('f1', 'u1');
    expect(res).toBeNull();
  });

  it('deleteFile deletes when found', async () => {
    prismaFindUnique.mockResolvedValue({ id: 'f1', ownerId: 'u1' });
    prismaDelete.mockResolvedValue(undefined);
    const res = await service.deleteFile('f1', 'u1');
    expect(prismaDelete).toHaveBeenCalledWith({ where: { id: 'f1' } });
    expect(res).toEqual({ success: true });
  });
});
