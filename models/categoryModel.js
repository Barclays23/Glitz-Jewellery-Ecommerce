const mongoose = require('mongoose');



const categorySchema = new mongoose.Schema({
    name : {
        type : String,
        required : true
    },
    description : {
        type : String,
        required : true
    },
    isListed : {
        type : Boolean,
        default : true
    },
    offerRef : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Offer',
    },
});


module.exports = mongoose.model('Category', categorySchema);