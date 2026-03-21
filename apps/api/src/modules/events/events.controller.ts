import { Request, Response } from 'express';
import { getAllEvents, getEventById, createEvent } from './events.service';
import { AuthRequest } from '../../middleware/auth.middleware';

export async function listEvents(req: Request, res: Response) {
  try {
    const events = await getAllEvents();
    return res.status(200).json({ events });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getEvent(req: Request, res: Response) {
  try {
    const data = await getEventById(req.params.id);
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(404).json({ error: error.message });
  }
}

export async function createEventHandler(req: AuthRequest, res: Response) {
  try {
    const { title, venue, event_date, total_seats, price_cents } = req.body;

    if (!title || !venue || !event_date || !total_seats || !price_cents) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const event = await createEvent(title, venue, event_date, total_seats, price_cents);
    return res.status(201).json({ message: 'Event created successfully', event });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}