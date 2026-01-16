import express from 'express';
import { 
    loginUser, 
    registerUser, 
    logoutUser, 
    updateUserProfile 
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { checkRole } from '../middleware/checkRole.middleware.js';

const router = express.Router();

// 1. Login (Public)
router.post('/login', loginUser);

// 2. Logout (Private - creates a clean audit trail)
router.post('/logout', logoutUser);

// 3. Create Sewadar (Private - Admin Only)
// First we check if they are logged in (protect), then check if they are admin
router.post(
    '/create-sewadar', 
    protect, 
    checkRole(['admin']), 
    registerUser
);

// 4. Update Profile (Private - Any logged in user)
// A Sewadar can change their own password here
router.put(
    '/profile', 
    protect, 
    updateUserProfile
);

export default router;