import { Router } from 'express';
import { getUserTicketsHandler, verifyTicketHandler } from './tickets.controller';
import { authenticate, authorizeAdmin } from '../../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getUserTicketsHandler);
router.post('/verify', authenticate, authorizeAdmin, verifyTicketHandler);

export default router;