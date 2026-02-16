const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const rifasSchema = new Schema({
    fecha: {
        type: Date,
        required: true
    },
    firstPrize: {
        type: Number,
        required: true
    },
    secondPrize: {
        type: Number,
        required: true
    },
    thirdPrize: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('Rifa', rifasSchema)