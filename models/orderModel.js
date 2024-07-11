const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userRef : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User',
        required : true
    },
    orderedItems : {
        required : true,
        type : [{
            // product : {
                productRef : {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true
                },
                image : {
                    type: String,
                    required: false
                },
                code : {
                    type: String,
                    required: true,
                    unique : false
                },
                purity : {
                    type: String,
                    required: true
                },
                name : {
                    type: String,
                    required : true
                },
                grossWeight: {
                    type : Number,
                    required: true
                },
                stoneWeight: {
                    type : Number,
                    required: true
                },
                netWeight: {
                    type : Number,
                    required: true
                },
                VA: {
                    type : Number,
                    required: true
                },
                metalPrice : {
                    type : Number,
                    required: true
                },
                makingCharge : {
                    type : Number,
                    required: true
                },
                stoneCharge: {
                    type : Number,
                    required: true
                },
                GST : {
                    type : Number,
                    required: true
                },
                totalPrice: {
                    type : Number,
                    required: true
                },
                quantity : {
                    type : Number,
                    required : true
                },
                orderStatus : {
                    type : String,
                    default : 'Pending',
                    enum : ['Pending', 'Processing', 'Order Confirmed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned']
                },
                deliveryDate : {
                    type: Date,
                    // required : true
                },
                returnDate : {
                    type: Date,
                    // required : true
                },
                cancelReason : {
                    type: String
                },
                returnReason : {
                    type: String
                },
            // },
        }]
    },

    shippingAddress : {
        type : Object,
        required : true
    },
    orderDate : {
        type: Date,
        default : Date.now
    },
    subTotal : {
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
    netAmount : {
        type : Number,
        required : true,
    },
    paymentMethod : {
        type : String,
        required : true,
        enum : ['Card Payment', 'RazorPay', 'PayPal', 'Online Payment', 'Cash On Delivery', 'Wallet'],
    },
    paymentStatus : {
        type : String,
        enum : ['Pending', 'Processing', 'Completed', 'Failed', 'Refunded'],
        default : 'Pending'
    },

});




module.exports = mongoose.model('Order', orderSchema);

