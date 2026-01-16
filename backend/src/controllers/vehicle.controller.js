import Vehicle from '../models/vehicle.model.js';
import { extractTextFromImage } from '../services/ocr.service.js';
import fs from 'fs';

// Helper to delete files
const deleteLocalFile = (filePath) => {
    if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
            if (err) console.error(`[Cleanup] Failed to delete: ${filePath}`);
        });
    }
};

// ==========================================
// STEP 1: SCAN PLATE (Process & Return Data)
// ==========================================
// @route POST /api/vehicles/scan
export const scanPlate = async (req, res) => {
    let localFilePath = '';
    
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image uploaded' });
        }
        localFilePath = req.file.path;

        // 1. Run OCR on the image
        let detectedPlate = "UNKNOWN";
        try {
            detectedPlate = await extractTextFromImage(localFilePath);
        } catch (error) {
            console.warn(`OCR Warning: ${error.message}`);
        }

        // 2. IMMEDIATE CLEANUP: Delete image now. We don't need it anymore.
        deleteLocalFile(localFilePath);

        // 3. Check History (Auto-fill Logic)
        // If we found a plate, check if we have a phone number for it in DB
        let historicalPhone = "";
        let historicalType = ""; // We can even suggest the vehicle type!
        
        if (detectedPlate && detectedPlate !== "UNKNOWN") {
            const previousRecord = await Vehicle.findOne({ plateNumber: detectedPlate })
                .sort({ entryTime: -1 })
                .select('phoneNumber vehicleType'); // Get phone and type
            
            if (previousRecord) {
                historicalPhone = previousRecord.phoneNumber || "";
                historicalType = previousRecord.vehicleType || "";
            }
        }

        // 4. Return Data to Frontend (So the User can see/edit it)
        res.json({
            success: true,
            data: {
                plateNumber: detectedPlate,
                suggestedPhone: historicalPhone,
                suggestedType: historicalType
            }
        });

    } catch (error) {
        if (localFilePath) deleteLocalFile(localFilePath);
        console.error(`Scan Error: ${error.message}`);
        res.status(500).json({ success: false, message: 'Server Error during Scan' });
    }
};

export const createEntry = async (req, res) => {
    try {
        const { plateNumber, vehicleType, phoneNumber } = req.body;

        if (!plateNumber || !vehicleType) {
            return res.status(400).json({ success: false, message: 'Plate Number and Type are required' });
        }

        // --- SANITIZATION LOGIC (The "Cleaner") ---
        // 1. Force Uppercase
        // 2. Remove "IND" or "INDIA" (Common OCR/Manual artifacts)
        // 3. Remove all non-alphanumeric characters (Spaces, dots, dashes)
        const finalPlate = plateNumber
            .toUpperCase()
            .replace(/INDIA/g, '') // Remove INDIA first (longer match)
            .replace(/IND/g, '')   // Remove IND
            .replace(/[^A-Z0-9]/g, ''); // Remove special chars

        // Check if we ended up with an empty string after cleaning
        if (!finalPlate) {
             return res.status(400).json({ success: false, message: 'Invalid Plate Number (Resulted in empty value)' });
        }

        // Create the record
        const newEntry = new VehicleEntry({
            plateNumber: finalPlate, // <--- We save the Cleaned version
            vehicleType,
            phoneNumber: phoneNumber || null,
            recordedBy: req.user._id 
        });

        await newEntry.save();

        res.status(201).json({
            success: true,
            message: 'Vehicle Entry Saved Successfully',
            data: {
                ...newEntry._doc,
                originalInput: plateNumber // Optional: Show what was sent vs what was saved
            }
        });

    } catch (error) {
        console.error(`Save Error: ${error.message}`);
        res.status(500).json({ success: false, message: 'Server Error during Save' });
    }
};