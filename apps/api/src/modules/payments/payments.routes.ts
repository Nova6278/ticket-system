import { Router } from 'express';
import {
  createPaymentIntentHandler,
  stripeWebhookHandler,
} from './payments.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.post(
  '/webhook',
  stripeWebhookHandler
);

router.post(
  '/create-intent',
  authenticate,
  createPaymentIntentHandler
);

export default router;