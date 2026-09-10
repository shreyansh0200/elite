import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { list, readAll } from '../controllers/notifications.js';

const router = Router();

router.get('/', auth, list);
router.patch('/read-all', auth, readAll);

export default router;
