import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import {
  createPaymentIntent,
  handlePaymentSuccess,
  handlePaymentFailure,
} from './payments.service';
import Stripe from 'stripe';
import { env } from '../../config/env';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export async function createPaymentIntentHandler(req: AuthRequest, res: Response) {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ error: 'bookingId is required' });
    }
    const result = await createPaymentIntent(bookingId, req.user!.userId);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}

export async function confirmPaymentHandler(req: AuthRequest, res: Response) {
  try {
    const { bookingId } = req.params;
    await handlePaymentSuccess(bookingId);
    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}

export async function stripeWebhookHandler(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret as string);
  } catch (err: any) {
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const bookingId = paymentIntent.metadata.bookingId;

  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(bookingId);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailure(bookingId);
      break;
  }

  return res.status(200).json({ received: true });
}