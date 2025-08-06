/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import express from 'express';
import * as path from 'path';
import { AuthController } from './app/auth.controller';
import { authMiddleware, AuthenticatedRequest } from './app/auth.middleware';
import { FilesController } from './app/files.controller';

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Wire up the authentication routes
app.use('/api/auth', AuthController);

// Wire up the file management routes
app.use('/api/files', FilesController);

app.get('/api', (req, res) => {
  res.send({ message: 'Welcome to backend-api!' });
});

// A protected route
app.get('/api/profile', authMiddleware, (req: AuthenticatedRequest, res) => {
  res.send({ message: `Welcome user ${req.user.userId}` });
});

const port = process.env.PORT || 3333;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
