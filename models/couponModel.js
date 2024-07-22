const mongoose = require('mongoose');



const couponSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    criteriaAmount: {
        type: Number,
        required: true,
    },  
    couponValue: {
        type: Number,
        required: true,
        min: 0
    },
    couponCount: {
        type: Number,
        default: 1 // Number of Coupons (number of times the coupon can be used)
    },
    usedCount: {
        type: Number,
        default: 0 // Number of times the coupon has been used
    },
    activationDate: {
        type: Date,
        required: true
    },
    expiryDate: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
});




module.exports = mongoose.model('Coupon', couponSchema);
