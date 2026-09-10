import { Router } from 'express';
import { auth, roles } from '../middleware/auth.js';
import multer from 'multer';
import { uploadImage } from '../services/upload.js';
import {
  listOpenSlots,
  createSlot,
  managerSlots,
  closeSlot,
  bookSlot,
  listRequests,
  managerRequests,
  managerStocks,
  cancelBooking,
  rejectFarmer,
  findTicketForPhysicalSubmission,
  receivePhysicalSubmission,
} from '../controllers/farmer.js';

const r = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Slots — hub manager publishes bookable pickup windows, farmers browse them.
r.get('/slots', auth, roles('farmer'), listOpenSlots);
r.post('/slots', auth, roles('hubmanager'), createSlot);
r.get('/slots/manager', auth, roles('hubmanager'), managerSlots);
r.patch('/slots/:id/close', auth, roles('hubmanager'), closeSlot);

// Tickets — self-service booking/reservation. Crop is NOT physically submitted here.
r.get('/requests', auth, roles('farmer'), listRequests);
r.post('/book', auth, roles('farmer'), upload.single('photo'), async (req, res, next) => {
  try {
    if (req.file) req.body.photoUrl = await uploadImage(req.file);
    await bookSlot(req, res);
  } catch (e) {
    next(e);
  }
});
r.patch('/requests/:id/cancel', auth, roles('farmer'), cancelBooking);

r.get('/manager/requests', auth, roles('hubmanager'), managerRequests);
r.get('/manager/stocks', auth, roles('hubmanager'), managerStocks);
r.get('/manager/physical-submission', auth, roles('hubmanager'), findTicketForPhysicalSubmission);
r.post('/manager/physical-submission', auth, roles('hubmanager'), receivePhysicalSubmission);
r.patch('/manager/requests/:id/reject', auth, roles('hubmanager'), rejectFarmer);

export default r;
