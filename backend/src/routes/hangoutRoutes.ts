
import express from 'express';
import {
    getHangouts,
    createHangout,
    cancelHangout,
    acceptHangout,
    rejectHangout
} from '../controllers/hangoutController';
import auth from '../middleware/auth';

const router = express.Router();

router.route('/')
    .get(auth, getHangouts)
    .post(auth, createHangout);

router.route('/:id')
    .delete(auth, cancelHangout);

router.route('/:id/accept').put(auth, acceptHangout);
router.route('/:id/reject').put(auth, rejectHangout);

export default router;
