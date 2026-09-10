import { Router } from 'express';
import { chat } from '../services/ai.js';

const r = Router();

r.post('/chat', chat);

export default r;
