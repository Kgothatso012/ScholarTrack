import { Router, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// GET /api/trips - Get trips (driver or parent)
router.get('/', authenticate, (req, res: Response) => {
  res.json({
    trips: [
      { id: '1', date: '2026-02-14', time: '07:30', status: 'completed', earnings: 150 },
      { id: '2', date: '2026-02-14', time: '14:00', status: 'in_progress', earnings: 150 },
    ],
  });
});

// GET /api/trips/active - Get active trip
router.get('/active', authenticate, (req, res: Response) => {
  res.json({
    trip: {
      id: '1',
      child_name: 'Amahle Moyo',
      pickup_location: '12 Oak Street, Sandton',
      dropoff_location: 'Sandton Primary',
      status: 'en_route',
    },
  });
});

// PUT /api/trips/:id/status - Update trip status
router.put('/:id/status', authenticate, (req, res: Response) => {
  const { status } = req.body;
  res.json({ message: 'Trip status updated', trip_id: req.params.id, status });
});

// POST /api/trips/:id/complete - Complete trip
router.post('/:id/complete', authenticate, (req, res: Response) => {
  res.json({ message: 'Trip completed', earnings: 150 });
});

export default router;
