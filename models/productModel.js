const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    categoryRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    name : {
        type: String,
        required : true
    },
    code : {
        type: String,
        required: true,
        unique : true
    },
    quantity : {
        type: Number,
        required: true
    },
    price: {
        type : Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    images : {
        image1 : {
            type: String,
            required: false
        },
        image2 : {
            type: String,
            required: false
        },
        image3 : {
            type: String,
            required: false
        },
        image4 : {
            type: String,
            required: false
        },
    },
    isCategoryBlocked : {
        type: Boolean,
        default: false
    },
    isBlocked : {
        type: Boolean,
        required: true,
        default: false
    }

})




module.exports = mongoose.model('Product', productSchema);
