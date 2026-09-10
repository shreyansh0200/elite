import { Router } from 'express';
import { getMandiPrices } from '../services/mandi.js';

const router = Router();

router.get('/prices', async (req, res, next) => {
  try {
    const data = await getMandiPrices(req.query);
    res.json(data);
  } catch (error) {
    console.error('Mandi prices error:', error);
    next(error);
  }
});

export default router;
