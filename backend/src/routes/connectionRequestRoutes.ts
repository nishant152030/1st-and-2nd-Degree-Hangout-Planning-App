
import express from 'express';
import { getMyConnectionRequests, handleConnectionApproval } from '../controllers/connectionRequestController';
import auth from '../middleware/auth';

const router = express.Router();

router.route('/').get(auth, getMyConnectionRequests);
router.route('/:id').put(auth, handleConnectionApproval);

export default router;
