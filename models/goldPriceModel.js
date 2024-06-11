const mongoose = require('mongoose');

const goldRateSchema = new mongoose.Schema({
    // date : {
    //     type: String,
    //     required : true
    // },
    price: {
        type : Number,
        required: true
    }
},
{ timestamps: true }
);




module.exports = mongoose.model('GoldPrice', goldRateSchema);
