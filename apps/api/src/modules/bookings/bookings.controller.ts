import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { createBooking, getUserBookings, getBookingById } from './bookings.service';

export async function createBookingHandler(req: AuthRequest, res: Response) {
  try {
    const { eventId, seatIds } = req.body;
    const userId = req.user!.userId;

    if (!eventId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({ error: 'eventId and seatIds are required' });
    }

    const result = await createBooking(userId, eventId, seatIds);
    return res.status(201).json({
      message: 'Seats held successfully. Complete payment within 10 minutes.',
      ...result,
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}

export async function getUserBookingsHandler(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const bookings = await getUserBookings(userId);
    return res.status(200).json({ bookings });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getBookingHandler(req: AuthRequest, res: Response) {
  try {
    const booking = await getBookingById(req.params.id, req.user!.userId);
    return res.status(200).json({ booking });
  } catch (error: any) {
    return res.status(404).json({ error: error.message });
  }
}