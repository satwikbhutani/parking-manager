import express from 'express';
import { getReports, getDashboardStats } from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';
import { checkRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// @route   GET /api/reports
// @desc    Get filtered vehicle logs (Date, Type, etc.)
// @access  Private (Admin Only)
router.get(
    '/',
    protect,
    checkRole(['admin']), // Sewadars cannot see this
    getReports
);

// @route   GET /api/reports/dashboard
// @desc    Get quick stats (Total cars today, Occupancy, etc.)
// @access  Private (Admin Only)
router.get(
    '/dashboard',
    protect,
    checkRole(['admin']),
    getDashboardStats
);

export default router;