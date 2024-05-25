const mongoose = require('mongoose');

const goldRateSchema = new mongoose.Schema({
    // date : {
    //     type: String,
    //     required : true
    // },
    price: {
        type : Number,
        required: true
    },
    // isBlocked : {
    //     type: Boolean,
    //     required: true,
    //     default: false
    // }

})




module.exports = mongoose.model('GoldPrice', goldRateSchema);
