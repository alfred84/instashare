import { PrismaClient } from '@prisma/client';
import { RegisterDto, LoginDto } from './auth.dto';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export class AuthService {
  async register(userData: RegisterDto) {
    const { email, password } = userData;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('User with this email already exists.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    return { message: `User ${user.email} registered successfully.` };
  }

  async login(credentials: LoginDto) {
    const { email, password } = credentials;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('Invalid credentials.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials.');
    }

    // TODO: Move secret to environment variables
    const token = jwt.sign({ userId: user.id }, 'YOUR_JWT_SECRET', { expiresIn: '1h' });

    return { message: 'Login successful', token };
  }
}
