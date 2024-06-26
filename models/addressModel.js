const mongoose = require ('mongoose');

const addressSchema = new mongoose.Schema({
    userRef : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User',
        required : true
    },
    address : [{
        firstname : {
            type : String,
            required : true
        },
        lastname : {
            type : String,
            required : true
        },
        street : {
            type : String,
            required : true
        },
        city : {
            type : String,
            required : true
        },
        pincode : {
            type : String,
            required : true
        },
        state : {
            type : String,
            required : true
        },
        contact : {
            type : String,
            required : true
        },
    }]
});



module.exports = mongoose.model('Address', addressSchema);