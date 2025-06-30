import express from 'express';
import { getAllUsers, updateUserProfile } from '../controllers/userController';
import auth from '../middleware/auth';

const router = express.Router();

router.route('/').get(auth, getAllUsers);
router.route('/allusers').get(getAllUsers); // Public route for all users
router.route('/:id').put(auth, updateUserProfile);

export default router;
