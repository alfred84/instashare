import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';


// Minimal type for a Multer in-memory uploaded file to avoid relying on Express.Multer types
export interface UploadedFile {
  originalname: string;
  size: number;
  mimetype: string;
  buffer: Buffer;
}

// Extend the Express Request type to include our custom user property
export interface AuthenticatedRequest extends Request {
  user?: { userId: string };
    file?: UploadedFile;
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token is required.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // TODO: Move secret to environment variables
    const decoded = jwt.verify(token, 'YOUR_JWT_SECRET');
    req.user = decoded as { userId: string };
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};
