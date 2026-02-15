import { Router, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// GET /api/parents/me - Get current parent profile
router.get('/me', authenticate, authorize('parent'), (req, res: Response) => {
  res.json({
    id: 'parent-1',
    user_id: 'user-1',
    full_name: 'John Moyo',
    phone: '0821234567',
    address: '12 Oak Street, Sandton',
    children: [
      { id: '1', name: 'Amahle Moyo', school: 'Sandton Primary', grade: 'Grade 5' },
      { id: '2', name: 'Lethabo Moyo', school: 'Sandton Primary', grade: 'Grade 3' },
    ],
  });
});

// GET /api/parents/me/driver - Get hired driver
router.get('/me/driver', authenticate, authorize('parent'), (req, res: Response) => {
  res.json({
    id: 'driver-1',
    name: 'Thabo Mkhize',
    phone: '0821234567',
    vehicle: 'Toyota Quantum',
    rating: 4.8,
    is_verified: true,
  });
});

// POST /api/parents/me/hire - Hire a driver
router.post('/me/hire', authenticate, authorize('parent'), (req, res: Response) => {
  const { driver_id } = req.body;
  res.json({ message: 'Driver hired successfully', driver_id });
});

// GET /api/parents/me/trips - Get upcoming trips
router.get('/me/trips', authenticate, authorize('parent'), (req, res: Response) => {
  res.json({
    trips: [
      { id: '1', child: 'Amahle Moyo', date: '2026-02-17', time: '07:30', status: 'scheduled' },
    ],
  });
});

export default router;
