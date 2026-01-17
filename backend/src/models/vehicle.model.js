import mongoose from 'mongoose';

const VehicleSchema = new mongoose.Schema({
    plateNumber: { 
        type: String, 
        required: true, 
        uppercase: true, // Auto-convert "dl4c" to "DL4C"
        trim: true 
    },
    vehicleType: { 
        type: String, 
        enum: ['2-Wheeler', '4-Wheeler', 'Others'], 
        required: true 
    },
    phoneNumber: { 
        type: String, 
        default: null,
        trim: true 
    },
    // The exact time the vehicle arrived
    entryTime: { 
        type: Date, 
        default: Date.now,
        index: true // INDEXED: Makes generating Date-wise reports much faster
    },
    // Link to the Sewadar who added this vehicle (Audit trail)
    recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

// INDEXING: 
// We index 'plateNumber' so looking up vehicle history (for auto-fill phone) is instant.
VehicleSchema.index({ plateNumber: 1 });

const Vehicle = mongoose.model('Vehicle', VehicleSchema);
export default Vehicle;