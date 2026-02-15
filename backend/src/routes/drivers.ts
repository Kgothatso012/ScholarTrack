import { Router, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// GET /api/drivers/me - Get current driver profile
router.get('/me', authenticate, authorize('driver'), (req, res: Response) => {
  res.json({
    id: 'driver-1',
    user_id: 'user-1',
    full_name: 'Thabo Mkhize',
    phone: '0821234567',
    pdp_number: 'PDP12345678',
    vehicle: 'Toyota Quantum',
    vehicle_plate: 'GP 123-456',
    rating: 4.8,
    trips_completed: 450,
    is_verified: true,
    compliance_status: 'approved',
  });
});

// GET /api/drivers/:id - Get driver by ID
router.get('/:id', (req, res: Response) => {
  res.json({
    id: req.params.id,
    full_name: 'Thabo Mkhize',
    rating: 4.8,
    review_count: 127,
    vehicle: 'Toyota Quantum',
    vehicle_plate: 'GP 123-456',
    trips_completed: 450,
    is_verified: true,
    distance: '2.3 km',
    response_time: '< 5 min',
  });
});

// PUT /api/drivers/me - Update driver profile
router.put('/me', authenticate, authorize('driver'), (req, res: Response) => {
  res.json({ message: 'Driver profile updated' });
});

// GET /api/drivers/:id/reviews - Get driver reviews
router.get('/:id/reviews', (req, res: Response) => {
  res.json({
    reviews: [
      { id: '1', rating: 5, comment: 'Excellent service!', month: '2026-02' },
      { id: '2', rating: 4, comment: 'Very reliable', month: '2026-01' },
    ],
  });
});

export default router;
