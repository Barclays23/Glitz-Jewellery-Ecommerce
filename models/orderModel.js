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
            offerDiscount : {
                type : Number,
                // required : true
            },
            quantity : {
                type : Number,
                required : true
            },
            paymentStatus : {
                type : String,
                enum : ['Pending', 'Failed', 'Success', 'Refunded'],
                default : 'Pending'
            },
            productStatus : {
                type : String,
                enum : [ 'Not Applicable', 'Pending Confirmation', 'Placed', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered', 'Return Requested', 'Return Request Rejected', 'Return Request Accepted', 'Returned', 'Cancelled' ]
            },
            deliveryDate : {
                type: Date,
                // required : true
            },
            cancelDate : {
                type: Date,
                // required : true
            },
            cancelReason : {
                type: String,
                // required : true
            },
            returnDate : {
                type: Date,
                // required : true
            },
            returnReason : {
                type: String,
                // required : true
            },
        }]
    },

    shippingAddress : {
        type : Object,
        required : true
    },
    orderNo : {
        type : String,
        required : true
    },
    orderDate : {
        type: Date,
        default : Date.now
    },
    billingRate : {
        type : Number,
        required : true
    },
    subTotal : {
        type : Number,
        required : true
    },
    deliveryCharge : {
        type : Number,
        required : true
    },
    couponDiscount : {
        type : Number,
        // required : true
    },
    specialDiscount : { // old discount structure (not using now after coupon & offer)
        type : Number,
        // required : true
    },
    netAmount : {   // after all discounts (payable amount)
        type : Number,
        required : true,
    },
    paymentMethod : {
        type : String,
        required : true,
        enum : ['Cash On Delivery', 'Wallet', 'Online Payment'],
    },
    orderStatus : {
        type : String,
        default : 'Pending',
        enum : ['Pending', 'Failed', 'Processing', 'Process Completed']
    },
    shipmentPendings : {
        type : Number,
        default : 0
    },
    deliveryPendings : {
        type : Number,
        default : 0
    },
    cancelledCount : {
        type : Number,
        default : 0
    },
    deliveredCount : {
        type : Number,
        default : 0
    },
    returnedCount : {
        type : Number,
        default : 0
    },
    returnRequests : {
        type : Number,
        default : 0
    },

});




module.exports = mongoose.model('Order', orderSchema);

