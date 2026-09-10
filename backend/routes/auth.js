import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { login, me, register, listHubCities } from '../controllers/auth.js';

const r = Router();
r.get('/hubs', listHubCities);
r.post('/register', register);
r.post('/login', login);
r.get('/me', auth, me);
export default r;
