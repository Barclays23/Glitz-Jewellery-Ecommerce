const mongoose = require('mongoose');



const userSchema = new mongoose.Schema({
    googleAccount: {   // for google auth
        googleId : {
            type : String,
            required : true
        },
        googlePhoto : {
            type : String,
            required : false
        },
        displayName : {
            type : String,
            required : true
        },
        firstname : {
            type : String,
            required : true
        },
        lastname : {
            type : String,
            required : true
        }
    },

    email : {
        type : String,
        required : true,
        unique : true
    },
    mobile : {
        type : String,
        // required : true,
        unique : true,
    },
    firstname : {
        type : String,
        required : true
    },
    lastname : {
        type : String,
        required : true
    },
    photo : {
        type : String,
        required : false
    },
    password : {
        type : String,
        // required : true,
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
    },
    isBlocked : {
        type : Boolean,
        default : false
    }
});


module.exports = mongoose.model('User', userSchema);