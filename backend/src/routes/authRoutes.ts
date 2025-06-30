
import express from 'express';
import { signupUser, loginUser, getSessionUser, logoutUser } from '../controllers/authController';
import auth from '../middleware/auth';

const router = express.Router();

router.post('/signup', signupUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/session', auth, getSessionUser);

export default router;
