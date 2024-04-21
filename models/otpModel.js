const mongoose = require('mongoose');



const otpSchema = new mongoose.Schema({
    otp: {
        type: String,
        required: true
    },
    userRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    expireAt: {
        type: Date,
        required: true
    },
    used: {
        type: Boolean,
        default: false
    },
});




module.exports = mongoose.model('UserOtp', otpSchema);
