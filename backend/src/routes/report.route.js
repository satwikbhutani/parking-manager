import express from 'express';
import { getReports, getDashboardStats } from '../controllers/report.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { checkRole } from '../middleware/checkRole.middleware.js';

const router = express.Router();

router.get(
    '/',
    protect,
    checkRole(['admin']), // Sewadars cannot see this
    getReports
);

router.get(
    '/dashboard',
    protect,
    checkRole(['admin']),
    getDashboardStats
);

export default router;