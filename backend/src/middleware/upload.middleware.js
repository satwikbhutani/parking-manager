import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// 1. Recreate __dirname for ES Modules (Required in Node.js when using 'import')
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. Configure Storage Engine
const storage = multer.diskStorage({
    destination(req, file, cb) {
        // Define the upload path
        const uploadPath = path.join(__dirname, '../uploads/');

        // Security: Check if folder exists, if not, create it recursively
        // This prevents the server from crashing if you forget to make the folder
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename(req, file, cb) {
        // Generate a unique filename: fieldname-timestamp-random.ext
        // Example: platePhoto-1698234123-999.jpg
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
});

// 3. File Filter (Security: Allow Images Only)
const fileFilter = (req, file, cb) => {
    // Allowed extensions
    const filetypes = /jpg|jpeg|png|webp/;
    // Check extension
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime type (e.g., image/jpeg)
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        // Pass a standard error if file is wrong
        cb(new Error('Invalid file type. Only JPG, JPEG, PNG, and WEBP are allowed.'));
    }
};

// 4. Initialize Multer
const upload = multer({
    storage: storage,
    limits: { 
        fileSize: 5 * 1024 * 1024 // Limit: 5MB per file
    },
    fileFilter: fileFilter
});

export default upload;