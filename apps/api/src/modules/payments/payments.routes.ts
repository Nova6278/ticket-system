import { Router } from 'express';
import {
  createPaymentIntentHandler,
  stripeWebhookHandler,
  confirmPaymentHandler,
} from './payments.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.post('/webhook', stripeWebhookHandler);
router.post('/create-intent', authenticate, createPaymentIntentHandler);
router.post('/confirm/:bookingId', authenticate, confirmPaymentHandler);

export default router;