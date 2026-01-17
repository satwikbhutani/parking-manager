import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const protect = async (req, res, next) => {
    try {
        const token= req.cookies.jwt;
        if(!token){
            return res.status(401).json({ message: 'Unauthorized, no token provided' });
        }

        const decode=jwt.verify(token, process.env.JWT_SECRET_KEY);

        if(!decode || !decode.userId) {
            return res.status(401).json({ message: 'Unauthorized, invalid token' });
        }

        const user=await User.findById(decode.userId).select('-password');
        if(!user) {
            return res.status(401).json({ message: 'Unauthorized, user not found' });
        }

        req.user = user;
        next();
    }
    catch (error) {
        console.error('Error in protect middleware:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}