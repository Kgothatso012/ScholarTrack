import { Router, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// GET /api/payments - Get payments
router.get('/', authenticate, (req, res: Response) => {
  res.json({
    payments: [
      { id: '1', amount: 2500, month: '2026-02', status: 'paid', date: '2026-02-01' },
      { id: '2', amount: 2500, month: '2026-01', status: 'paid', date: '2026-01-01' },
    ],
  });
});

// GET /api/payments/pending - Get pending payment
router.get('/pending', authenticate, (req, res: Response) => {
  res.json({
    payment: { id: '1', amount: 2500, due_date: '2026-02-15' },
  });
});

// POST /api/payments - Process payment (Yoco)
router.post('/', authenticate, (req, res: Response) => {
  res.json({ message: 'Payment processed', payment_id: 'pay-' + Date.now() });
});

// GET /api/payments/:id/invoice - Get invoice
router.get('/:id/invoice', authenticate, (req, res: Response) => {
  res.json({
    invoice_number: 'INV-2026-0201',
    amount: 2500,
    date: '2026-02-01',
  });
});

export default router;
