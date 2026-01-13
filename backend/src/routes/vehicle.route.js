import express from 'express';
import { createEntry } from '../controllers/vehicleController.js';
import { protect } from '../middleware/authMiddleware.js';
import { checkRole } from '../middleware/roleMiddleware.js';
import upload from '../middleware/uploadMiddleware.js'; // Multer config

const router = express.Router();

// @route   POST /api/vehicles/entry
// @desc    Upload photo, OCR scan, and save vehicle entry
// @access  Private (Admin & Sewadar)
router.post(
    '/entry',
    protect,
    checkRole(['admin', 'sewadar']), // Both roles can do this
    upload.single('platePhoto'),     // Handle the file upload before controller
    createEntry
);

export default router;