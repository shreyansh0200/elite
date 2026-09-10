import { Router } from 'express';
import { listMarket } from '../controllers/market.js';

const router = Router();

router.get('/', listMarket);

export default router;
