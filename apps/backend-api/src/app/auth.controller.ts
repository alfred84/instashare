import { Router, Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './auth.dto';

const router = Router();
const authService = new AuthService();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const registerDto: RegisterDto = req.body;
    const result = await authService.register(registerDto);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const loginDto: LoginDto = req.body;
    const result = await authService.login(loginDto);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export const AuthController = router;
