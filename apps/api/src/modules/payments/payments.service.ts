import Stripe from 'stripe';
import { db } from '../../config/database';
import { env } from '../../config/env';
import { createTicketsForBooking } from '../tickets/tickets.service';
import { releaseSeat } from '../bookings/seat-lock.service';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export async function createPaymentIntent(bookingId: string, userId: string) {
  const bookingResult = await db.query(
    `SELECT * FROM bookings WHERE id = $1 AND user_id = $2 AND status = 'pending'`,
    [bookingId, userId]
  );

  if (bookingResult.rows.length === 0) {
    throw new Error('Booking not found or already paid');
  }

  const booking = bookingResult.rows[0];

  const paymentIntent = await stripe.paymentIntents.create({
    amount: booking.total_cents,
    currency: 'inr',
    metadata: { bookingId, userId },
  });

  await db.query(
    `UPDATE bookings SET stripe_payment_intent = $1 WHERE id = $2`,
    [paymentIntent.id, bookingId]
  );

  return {
    clientSecret: paymentIntent.client_secret,
    amount: booking.total_cents,
    bookingId,
  };
}

export async function handlePaymentSuccess(bookingId: string) {
  const seatsResult = await db.query(
    `SELECT id FROM seats WHERE status = 'held'
     AND id IN (
       SELECT seat_id FROM tickets WHERE booking_id = $1
       UNION
       SELECT s.id FROM seats s
       JOIN bookings b ON s.event_id = b.event_id
       WHERE b.id = $1 AND s.status = 'held'
     )`,
    [bookingId]
  );

  const booking = await db.query(
    `SELECT * FROM bookings WHERE id = $1`,
    [bookingId]
  );

  if (booking.rows.length === 0) return;

  const seatIds = seatsResult.rows.map((s: any) => s.id);
  await createTicketsForBooking(bookingId, seatIds);
}

export async function handlePaymentFailure(bookingId: string) {
  const seatsResult = await db.query(
    `SELECT id FROM seats WHERE status = 'held'
     AND event_id = (SELECT event_id FROM bookings WHERE id = $1)`,
    [bookingId]
  );

  const seatIds = seatsResult.rows.map((s: any) => s.id);
  await Promise.all(seatIds.map((id: string) => releaseSeat(id)));

  await db.query(
    `UPDATE seats SET status = 'available' WHERE id = ANY($1)`,
    [seatIds]
  );

  await db.query(
    `UPDATE bookings SET status = 'cancelled' WHERE id = $1`,
    [bookingId]
  );
}