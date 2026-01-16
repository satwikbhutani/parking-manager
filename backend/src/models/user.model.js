import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true, 
        unique: true, 
        trim: true 
    },
    // The Sewadar's real name (e.g., "Ramesh Kumar") for display
    fullName: {
        type: String,
        required: true
    },
    password: { 
        type: String, 
        required: true 
    },
    role: { 
        type: String, 
        enum: ['admin', 'sewadar'], 
        default: 'sewadar',
        required: true
    },
},
{ timestamps: true });

// --- Security Logic ---

// 1. Password Hashing Middleware
// Automatically encrypts password before saving to DB
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }
    try
    {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    }
    catch (error)
    {
        next(error);
    }
});

// 2. Password Verification Method
// Used during Login to compare input password with database hash
UserSchema.methods.matchPassword = async function(enteredPassword) {
    try{
        return await bcrypt.compare(enteredPassword, this.password);
    }
    catch(error){
        throw new Error("Password comparison failed");
    }
};

const User = mongoose.model('User', UserSchema);
export default User;