import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// The Free OCR API Endpoint
const OCR_API_URL = 'https://api.ocr.space/parse/image';

export const extractTextFromImage = async (filePath) => {
    try {
        // 1. Prepare the Form Data (simulating a file upload form)
        const formData = new FormData();
        formData.append('apikey', 'K81826534488957'); // Get key from .env
        formData.append('language', 'eng'); // English
        formData.append('isOverlayRequired', 'false');
        formData.append('file', fs.createReadStream(filePath));
        formData.append('OCREngine', '2'); // Engine 2 is better for numbers/plates

        // 2. Send Request to OCR.space
        const response = await axios.post(OCR_API_URL, formData, {
            headers: {
                ...formData.getHeaders()
            }
        });

        // 3. Process the Response
        // The API returns a JSON object. We need to dig into it.
        const parsedResults = response.data.ParsedResults;

        if (!parsedResults || parsedResults.length === 0) {
            throw new Error("No text found in API response");
        }

        // Extract the raw text found
        const rawText = parsedResults[0].ParsedText;

        // 4. Clean the Text (Same logic as before: remove spaces, special chars)
        // Example: "DL 4C\r\n1234" -> "DL4C1234"
        const cleanText = rawText
            .toUpperCase()
            .replace(/[\r\n\s]/g, '') // Remove newlines and spaces
            .replace(/[^A-Z0-9]/g, ''); // Remove anything that isn't a Letter or Number

        return cleanText || "UNKNOWN";

    } catch (error) {
        console.error("OCR API Error:", error.message);
        // If API fails (e.g. no internet), return null so the controller handles it safely
        return null;
    }
};