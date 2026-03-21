import crypto from 'crypto';
import { db } from '../../config/database';
import { env } from '../../config/env';

export function generateQRCode(ticketId: string, bookingId: string): string {
  const payload = `${ticketId}:${bookingId}:${Date.now()}`;
  const signature = crypto
    .createHmac('sha256', env.TICKET_SECRET)
    .update(payload)
    .digest('hex');
  return Buffer.from(`${payload}:${signature}`).toString('base64url');
}

export function verifyQRCode(token: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    const parts = decoded.split(':');
    const signature = parts.pop()!;
    const payload = parts.join(':');
    const expected = crypto
      .createHmac('sha256', env.TICKET_SECRET)
      .update(payload)
      .digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}

export async function createTicketsForBooking(
  bookingId: string,
  seatIds: string[]
) {
  const tickets = [];

  for (const seatId of seatIds) {
    const ticketId = crypto.randomUUID();
    const qrCode = generateQRCode(ticketId, bookingId);

    const result = await db.query(
      `INSERT INTO tickets (id, booking_id, seat_id, qr_code)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [ticketId, bookingId, seatId, qrCode]
    );

    tickets.push(result.rows[0]);
  }

  await db.query(
    `UPDATE seats SET status = 'booked' WHERE id = ANY($1)`,
    [seatIds]
  );

  await db.query(
    `UPDATE bookings SET status = 'confirmed' WHERE id = $1`,
    [bookingId]
  );

  await db.query(
    `UPDATE events SET available_seats = available_seats - $1
     WHERE id = (SELECT event_id FROM bookings WHERE id = $2)`,
    [seatIds.length, bookingId]
  );

  return tickets;
}

export async function getUserTickets(userId: string) {
  const result = await db.query(
    `SELECT t.*, s.seat_number, s.section, s.price_cents,
            e.title, e.venue, e.event_date
     FROM tickets t
     JOIN bookings b ON t.booking_id = b.id
     JOIN seats s ON t.seat_id = s.id
     JOIN events e ON b.event_id = e.id
     WHERE b.user_id = $1
     ORDER BY t.created_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function verifyTicket(qrCode: string) {
  const isValid = verifyQRCode(qrCode);
  if (!isValid) {
    throw new Error('Invalid ticket');
  }

  const result = await db.query(
    `SELECT t.*, s.seat_number, e.title, e.event_date
     FROM tickets t
     JOIN seats s ON t.seat_id = s.id
     JOIN bookings b ON t.booking_id = b.id
     JOIN events e ON b.event_id = e.id
     WHERE t.qr_code = $1`,
    [qrCode]
  );

  if (result.rows.length === 0) {
    throw new Error('Ticket not found');
  }

  const ticket = result.rows[0];

  if (ticket.is_used) {
    throw new Error('Ticket already used');
  }

  await db.query(
    `UPDATE tickets SET is_used = TRUE WHERE qr_code = $1`,
    [qrCode]
  );

  return { valid: true, ticket };
}