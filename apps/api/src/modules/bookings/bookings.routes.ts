import { Router } from 'express';
import {
  createBookingHandler,
  getUserBookingsHandler,
  getBookingHandler,
} from './bookings.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, createBookingHandler);
router.get('/', authenticate, getUserBookingsHandler);
router.get('/:id', authenticate, getBookingHandler);

export default router;