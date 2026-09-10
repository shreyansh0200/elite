import {Router} from 'express'; import {listMarket} from '../controllers/market.js'; const r=Router();r.get('/',listMarket);export default r;
