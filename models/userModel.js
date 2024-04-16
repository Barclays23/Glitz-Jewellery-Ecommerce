const mongoose = require('mongoose');



const userSchema = new mongoose.Schema({
    firstname : {
        type : String,
        required : true
    },
    lastname : {
        type : String,
        required : true
    },
    email : {
        type : String,
        required : true,
        unique : true
    },
    mobile : {
        type : Number,
        required : true,
        unique : true,
    },
    photo : {
        type : String,
        required : false
    },
    password : {
        type : String,
        required : true,
    },
    isVerified : {
        type : Number,
        default : 0
    },
    isAdmin : {
        type : Number,
        default : 0,
        required : true
    }
});


module.exports = mongoose.model('User', userSchema);