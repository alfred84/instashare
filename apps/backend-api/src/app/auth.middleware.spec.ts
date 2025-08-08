import { authMiddleware, AuthenticatedRequest } from './auth.middleware';

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

import * as jwt from 'jsonwebtoken';

describe('authMiddleware', () => {
  const makeRes = () => {
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
      send: jest.fn(),
    };
    return res;
  };

  it('returns 401 when Authorization header missing', () => {
    const req = { headers: {} } as unknown as AuthenticatedRequest;
    const res = makeRes();
    const next = jest.fn();

    authMiddleware(req, res as any, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Authorization token is required.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when header does not start with Bearer', () => {
    const req = { headers: { authorization: 'Token abc' } } as unknown as AuthenticatedRequest;
    const res = makeRes();
    const next = jest.fn();

    authMiddleware(req, res as any, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Authorization token is required.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token is invalid', () => {
    (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error('bad'); });
    const req = { headers: { authorization: 'Bearer bad' } } as unknown as AuthenticatedRequest;
    const res = makeRes();
    const next = jest.fn();

    authMiddleware(req, res as any, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next and sets req.user when token valid', () => {
    (jwt.verify as jest.Mock).mockReturnValue({ userId: 'u1' });
    const req: any = { headers: { authorization: 'Bearer good' } } as unknown as AuthenticatedRequest;
    const res = makeRes();
    const next = jest.fn();

    authMiddleware(req, res as any, next);
    expect(req.user).toEqual({ userId: 'u1' });
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
