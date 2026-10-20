import { Router, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// GET /api/compliance/me - Get compliance status
router.get('/me', authenticate, authorize('driver'), (req, res: Response) => {
  res.json({
    pdp: { status: 'approved', expiry: '2027-01-01' },
    roadworthy: { status: 'approved', expiry: '2026-06-01' },
    license: { status: 'approved', expiry: '2028-01-01' },
    insurance: { status: 'approved', expiry: '2026-12-01' },
    vehicle_permit: { status: 'pending' },
    overall_status: 'pending',
  });
});

// POST /api/compliance/documents - Upload document
router.post('/documents', authenticate, authorize('driver'), (req, res: Response) => {
  const { document_type } = req.body;
  res.json({ message: 'Document uploaded', document_type });
});

// PUT /api/compliance/documents/:id - Update document
router.put('/documents/:id', authenticate, authorize('driver'), (req, res: Response) => {
  res.json({ message: 'Document updated' });
});

export default router;
