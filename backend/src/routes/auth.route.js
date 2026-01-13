import express from 'express';
import { loginUser, registerUser } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { checkRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// @route   POST /api/auth/login
// @desc    Auth user & get token
// @access  Public
router.post('/login', loginUser);

// @route   POST /api/auth/create-sewadar
// @desc    Register a new Sewadar (Guard)
// @access  Private (Admin Only)
// Logic: First verify token (protect), then check if user is admin (checkRole)
router.post(
    '/create-sewadar', 
    protect, 
    checkRole(['admin']), 
    registerUser
);

export default router;