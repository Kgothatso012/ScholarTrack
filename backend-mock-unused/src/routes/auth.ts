import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { generateToken, authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// ============ VALIDATION SCHEMAS ============

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().length(10),
  full_name: z.string().min(2),
  role: z.enum(['driver', 'parent']),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// ============ ROUTES ============

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    
    // In production: Insert into database
    // const hashedPassword = await bcrypt.hash(data.password, 10);
    // const user = await db.users.insert({ ...data, password_hash: hashedPassword });
    
    // Mock response for now
    const user = {
      id: 'user-' + Date.now(),
      email: data.email,
      phone: data.phone,
      full_name: data.full_name,
      role: data.role,
    };
    
    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    
    res.status(201).json({
      message: 'User registered successfully',
      user,
      token,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);
    
    // In production: Fetch user from database
    // const user = await db.users.findOne({ email: data.email });
    // const validPassword = await bcrypt.compare(data.password, user.password_hash);
    
    // Mock response
    const user = {
      id: 'user-' + Date.now(),
      email: data.email,
      role: data.email.includes('driver') ? 'driver' : 'parent',
      full_name: 'Test User',
    };
    
    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    
    res.json({
      message: 'Login successful',
      user,
      token,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// GET /api/auth/me - Get current user
router.get('/me', authenticate, (req: AuthRequest, res: Response) => {
  // In production: Fetch user from database
  res.json({
    user: req.user,
  });
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response) => {
  // In production: Blacklist token if needed
  res.json({ message: 'Logged out successfully' });
});

export default router;
