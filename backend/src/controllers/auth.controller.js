import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';

// --- Helper: Generate Token ---
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Auth user & set HttpOnly cookie
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. Validate Input
        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide username and password' 
            });
        }

        // 2. Check Database
        const user = await User.findOne({ username });

        // 3. Verify Password
        if (user && (await user.matchPassword(password))) {
            const token = generateToken(user._id);

            // 4. Set Secure Cookie
            res.cookie('jwt', token, {
                httpOnly: true, // Cannot be accessed by JS
                secure: process.env.NODE_ENV !== 'development', // HTTPS only in prod
                sameSite: 'strict', // CSRF protection
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 Days
            });

            // 5. Send Response (No token in body)
            res.json({
                success: true,
                _id: user._id,
                username: user.username,
                fullName: user.fullName,
                role: user.role
            });
        } else {
            res.status(401).json({ 
                success: false, 
                message: 'Invalid username or password' 
            });
        }
    } catch (error) {
        console.error(`Login Error: ${error.message}`);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Register a new user (Sewadar/Admin)
// @route   POST /api/auth/create-sewadar
// @access  Private (Admin Only)
export const registerUser = async (req, res) => {
    try {
        const { username, password, fullName, role } = req.body;

        if (!username || !password || !fullName) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please fill all fields' 
            });
        }

        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username already exists' 
            });
        }

        // Create user (Password hashing handled by User model pre-save hook)
        const user = await User.create({
            username,
            password,
            fullName,
            role: role || 'sewadar' // Default to sewadar
        });

        if (user) {
            res.status(201).json({
                success: true,
                message: 'User created successfully',
                user: {
                    _id: user._id,
                    username: user.username,
                    role: user.role
                }
            });
        } else {
            res.status(400).json({ success: false, message: 'Invalid user data' });
        }
    } catch (error) {
        console.error(`Register Error: ${error.message}`);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
export const logoutUser = (req, res) => {
    // Overwrite the cookie with one that expires immediately
    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0),
    });
    res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// @desc    Update user profile (Name or Password)
// @route   PUT /api/auth/profile
// @access  Private (Logged in user)
export const updateUserProfile = async (req, res) => {
    try {
        // req.user is set by the 'protect' middleware
        const user = await User.findById(req.user._id);

        if (user) {
            // Update fields if provided, otherwise keep existing
            user.username = req.body.username || user.username;
            user.fullName = req.body.fullName || user.fullName;

            // Only update password if user typed a new one
            if (req.body.password) {
                user.password = req.body.password; 
                // Note: The pre-save hook in User.js will catch this and hash it automatically
            }

            const updatedUser = await user.save();

            res.json({
                success: true,
                message: 'Profile Updated',
                user: {
                    _id: updatedUser._id,
                    username: updatedUser.username,
                    fullName: updatedUser.fullName,
                    role: updatedUser.role
                }
            });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        console.error(`Update Error: ${error.message}`);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};