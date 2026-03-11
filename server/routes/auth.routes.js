import express from 'express';
import { register, login,logout,getAllUsers,updateProfile, changePassword,getMe,getUserAccountData} from '../controllers/auth.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
const router = express.Router();


router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.get('/account-data', protect, getUserAccountData);
router.get('/users', protect, authorize('admin'), getAllUsers);
router.put('/update-profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

export default router;
