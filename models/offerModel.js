const mongoose = require('mongoose');



const offerSchema = new mongoose.Schema({
    offerName : {
        type: String,
        required: true
    },
    offerPercentage : {
        type : Number,
        required : true
    },
    activationDate : {
        type : Date,
        required : true
    },
    expiryDate : {
        type : Date,
        required : true
    },
    isListed : {
        type : Boolean,
        required : true
    }
});




module.exports = mongoose.model('Offer', offerSchema);
