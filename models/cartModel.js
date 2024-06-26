const mongoose = require('mongoose');


const cartSchema = new mongoose.Schema({
    userRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    product : [{
        productRef: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type : Number,
            default : 1
        },
    }],
});



module.exports = mongoose.model('Cart', cartSchema);