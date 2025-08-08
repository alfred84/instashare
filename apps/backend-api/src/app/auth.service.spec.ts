// Define mocks inside jest.mock factories to avoid hoisting issues
jest.mock('@prisma/client', () => {
  const mockUserFindUnique = jest.fn();
  const mockUserCreate = jest.fn();
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      user: {
        findUnique: mockUserFindUnique,
        create: mockUserCreate,
      },
    })),
    __mockUserFindUnique: mockUserFindUnique,
    __mockUserCreate: mockUserCreate,
  };
});

jest.mock('bcryptjs', () => {
  const hashMock = jest.fn();
  const compareMock = jest.fn();
  return {
    hash: (...args: any[]) => (hashMock as any)(...args),
    compare: (...args: any[]) => (compareMock as any)(...args),
    __hashMock: hashMock,
    __compareMock: compareMock,
  };
});

jest.mock('jsonwebtoken', () => {
  const signMock = jest.fn();
  return {
    sign: (...args: any[]) => (signMock as any)(...args),
    __signMock: signMock,
  };
});

import { AuthService } from './auth.service';
const { __mockUserFindUnique: mockUserFindUnique, __mockUserCreate: mockUserCreate } = require('@prisma/client');
const { __hashMock: hashMock, __compareMock: compareMock } = require('bcryptjs');
const { __signMock: signMock } = require('jsonwebtoken');

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService();
    mockUserFindUnique.mockReset();
    mockUserCreate.mockReset();
    hashMock.mockReset();
    compareMock.mockReset();
    signMock.mockReset();
  });

  it('register should throw if user already exists', async () => {
    mockUserFindUnique.mockResolvedValue({ id: 'u1', email: 'e@e.com' });
    await expect(service.register({ email: 'e@e.com', password: 'pw' }))
      .rejects.toThrow('User with this email already exists.');
  });

  it('register should create user and return token', async () => {
    mockUserFindUnique.mockResolvedValue(null);
    hashMock.mockResolvedValue('hashed');
    mockUserCreate.mockResolvedValue({ id: 'u1', email: 'e@e.com', password: 'hashed' });
    signMock.mockReturnValue('token-123');

    const result = await service.register({ email: 'e@e.com', password: 'pw' });
    expect(hashMock).toHaveBeenCalled();
    expect(mockUserCreate).toHaveBeenCalled();
    expect(signMock).toHaveBeenCalled();
    expect(result).toEqual({ accessToken: 'token-123' });
  });

  it('login should throw if user not found', async () => {
    mockUserFindUnique.mockResolvedValue(null);
    await expect(service.login({ email: 'x@x.com', password: 'pw' }))
      .rejects.toThrow('Invalid credentials.');
  });

  it('login should throw if password invalid', async () => {
    mockUserFindUnique.mockResolvedValue({ id: 'u1', email: 'e@e.com', password: 'hashed' });
    compareMock.mockResolvedValue(false);
    await expect(service.login({ email: 'e@e.com', password: 'bad' }))
      .rejects.toThrow('Invalid credentials.');
  });

  it('login should return token on success', async () => {
    mockUserFindUnique.mockResolvedValue({ id: 'u1', email: 'e@e.com', password: 'hashed' });
    compareMock.mockResolvedValue(true);
    signMock.mockReturnValue('token-xyz');

    const result = await service.login({ email: 'e@e.com', password: 'pw' });
    expect(compareMock).toHaveBeenCalled();
    expect(signMock).toHaveBeenCalled();
    expect(result).toEqual({ message: 'Login successful', accessToken: 'token-xyz' });
  });
});
