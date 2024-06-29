const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userRef : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User',
        required : true
    },
    products : [{
        productId : {
            type : mongoose.Schema.Types.ObjectId,
            ref : 'Product',
            required : true
        },
        price : {
            type : Number,
            required : true
        },
        quantity : {
            type : Number,
            required : true
        },
        totalPrice : {
            type : Number,
            required : true,
            // default : 0
        },
        productStatus : {    //what product status
            type : String,
            required : true
        }
    }],

    purchaseDate : {
        type: Date,
        required: true
    },
    deliveredDate : {
        type: Date,
        // required : true
    },
    returnedDate : {
        type: Date,
        // required : true
    },

    cancelReason : {
        type: String
    },
    returnReason : {
        type: String
    },

    subtotal : {
        type : Number,
        required : true
    },
    deliveryCharge : {
        type : Number,
        required : true
    },
    discountAmount : {
        type : Number,
        required : true
    },
    totalAmount : {
        type : Number,
        required : true,
    },
    paymentMethod: {
        type: String,
        required: true,
    },

    status : {               //what status ? payment or order ?
        type : String,
        type : true
    },

});




module.exports = mongoose.model('Order', orderSchema);