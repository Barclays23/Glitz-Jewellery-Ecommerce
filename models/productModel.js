const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    categoryRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    code : {
        type: String,
        unique : true,
        required: true
    },
    purity : {
        type: String,
        required: true
    },
    name : {
        type: String,
        required : true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type : Number,
        // required: true
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
    stoneCharge: {
        type : Number,
        required: true
    },
    quantity : {
        type: Number,
        required: true
    },
    // images: {
    //     type: Object,
    //     required: true
    // },
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
