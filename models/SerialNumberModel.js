const mongoose = require('mongoose');


const serialNumberSchema = new mongoose.Schema({
    year: {
        type: Number,
        required: true,
    },
    serial: {
        type: Number,
        default: 0,
    },
});



module.exports = mongoose.model('SerialNumber', serialNumberSchema);