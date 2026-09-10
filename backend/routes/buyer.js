import { Router } from 'express';
import { auth, roles } from '../middleware/auth.js';
import {
  createBuy,
  myBuys,
  managerBuys,
  grantBuy,
  rejectBuy,
  findReceiverToken,
  matchReceiverToken,
} from '../controllers/buyer.js';

const router = Router();

router.post('/', auth, roles('customer'), createBuy);
router.get('/mine', auth, roles('customer'), myBuys);
router.get('/manager', auth, roles('hubmanager'), managerBuys);
router.get('/manager/receiver-token', auth, roles('hubmanager'), findReceiverToken);
router.post('/manager/receiver-token', auth, roles('hubmanager'), matchReceiverToken);
router.patch('/:id/grant', auth, roles('hubmanager'), grantBuy);
router.patch('/:id/reject', auth, roles('hubmanager'), rejectBuy);

export default router;