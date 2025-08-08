import express, { json } from 'express';
import request from 'supertest';

// Mock AuthService before importing controller
const registerMock = jest.fn();
const loginMock = jest.fn();
jest.mock('./auth.service', () => {
  class AuthService {
    register = (...args: any[]) => (registerMock as any)(...args);
    login = (...args: any[]) => (loginMock as any)(...args);
  }
  return { AuthService };
});

import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(json());
    app.use('/api/auth', AuthController);
    registerMock.mockReset();
    loginMock.mockReset();
  });

  it('POST /register -> 201 on success', async () => {
    registerMock.mockResolvedValue({ accessToken: 't' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'e@e.com', password: 'pw' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ accessToken: 't' });
  });

  it('POST /register -> 400 on error', async () => {
    registerMock.mockRejectedValue(new Error('exists'));
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'e@e.com', password: 'pw' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: 'exists' });
  });

  it('POST /login -> 200 on success', async () => {
    loginMock.mockResolvedValue({ message: 'Login successful', accessToken: 't' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'e@e.com', password: 'pw' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Login successful', accessToken: 't' });
  });

  it('POST /login -> 400 on error', async () => {
    loginMock.mockRejectedValue(new Error('bad'));
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'e@e.com', password: 'pw' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: 'bad' });
  });
});
