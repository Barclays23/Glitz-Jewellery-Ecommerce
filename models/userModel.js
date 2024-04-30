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
        type : String,
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
    },
    token: {
        type: String,
        default: ''
    }
});


module.exports = mongoose.model('User', userSchema);