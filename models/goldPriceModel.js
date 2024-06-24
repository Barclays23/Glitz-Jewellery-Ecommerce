const mongoose = require('mongoose');

const goldRateSchema = new mongoose.Schema({
    price: {
        type : Number,
        default : 0,
        required: true
    }
},
{ timestamps: true }
);




module.exports = mongoose.model('GoldPrice', goldRateSchema);
