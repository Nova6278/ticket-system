import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { getUserTickets, verifyTicket } from './tickets.service';

export async function getUserTicketsHandler(req: AuthRequest, res: Response) {
  try {
    const tickets = await getUserTickets(req.user!.userId);
    return res.status(200).json({ tickets });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function verifyTicketHandler(req: AuthRequest, res: Response) {
  try {
    const { qrCode } = req.body;
    if (!qrCode) {
      return res.status(400).json({ error: 'QR code is required' });
    }
    const result = await verifyTicket(qrCode);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}