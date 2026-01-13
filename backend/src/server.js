import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js'; // Note the .js extension!

// Import Routes
import authRoutes from './routes/auth.route.js';
import vehicleRoutes from './routes/vehicle.route.js';
import reportRoutes from './routes/report.route.js';

// 1. Config
dotenv.config();
connectDB();

// 2. Fix __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 3. Middleware
app.use(express.json());
app.use(cors());

// 4. Static Folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 5. Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/reports', reportRoutes);

// 6. Error Handling
app.use((req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
});

app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});