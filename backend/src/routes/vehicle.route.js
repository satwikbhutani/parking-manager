import express from 'express';
import { scanPlate, createEntry } from '../controllers/vehicle.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js'; 

const router = express.Router();

// --- STEP 1: The "Eye" ---
// Takes an image, returns text. Does NOT save to DB yet.
router.post(
    '/scan',
    protect,
    upload.single('platePhoto'), // Handles the file here
    scanPlate
);

// --- STEP 2: The "Notebook" ---
// Takes the final JSON text (after user review) and saves it.
router.post(
    '/entry',
    protect,
    createEntry 
);

export default router;