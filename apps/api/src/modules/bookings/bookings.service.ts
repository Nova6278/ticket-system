import { db } from '../../config/database';
import { holdMultipleSeats, releaseSeat } from './seat-lock.service';

export async function createBooking(
  userId: string,
  eventId: string,
  seatIds: string[]
) {
  const seatsResult = await db.query(
    `SELECT * FROM seats WHERE id = ANY($1) AND event_id = $2 AND status = 'available'`,
    [seatIds, eventId]
  );

  if (seatsResult.rows.length !== seatIds.length) {
    throw new Error('One or more seats are not available');
  }

  const held = await holdMultipleSeats(seatIds, userId);
  if (!held) {
    throw new Error('One or more seats are already being booked by someone else');
  }

  try {
    const totalCents = seatsResult.rows.reduce(
      (sum: number, seat: any) => sum + seat.price_cents,
      0
    );

    const bookingResult = await db.query(
      `INSERT INTO bookings (user_id, event_id, status, total_cents)
       VALUES ($1, $2, 'pending', $3) RETURNING *`,
      [userId, eventId, totalCents]
    );

    const booking = bookingResult.rows[0];

    await db.query(
      `UPDATE seats SET status = 'held' WHERE id = ANY($1)`,
      [seatIds]
    );

    return { booking, seats: seatsResult.rows, totalCents };
  } catch (error) {
    await Promise.all(seatIds.map((id) => releaseSeat(id)));
    throw error;
  }
}

export async function getUserBookings(userId: string) {
  const result = await db.query(
    `SELECT b.*, e.title, e.venue, e.event_date
     FROM bookings b
     JOIN events e ON b.event_id = e.id
     WHERE b.user_id = $1
     ORDER BY b.created_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function getBookingById(bookingId: string, userId: string) {
  const result = await db.query(
    `SELECT b.*, e.title, e.venue, e.event_date
     FROM bookings b
     JOIN events e ON b.event_id = e.id
     WHERE b.id = $1 AND b.user_id = $2`,
    [bookingId, userId]
  );

  if (result.rows.length === 0) {
    throw new Error('Booking not found');
  }

  return result.rows[0];
}