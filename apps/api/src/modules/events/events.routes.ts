import { Router } from 'express';
import { listEvents, getEvent, createEventHandler } from './events.controller';
import { authenticate, authorizeAdmin } from '../../middleware/auth.middleware';

const router = Router();

router.get('/', listEvents);
router.get('/:id', getEvent);
router.post('/', authenticate, authorizeAdmin, createEventHandler);

export default router;