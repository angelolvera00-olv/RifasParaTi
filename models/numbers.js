const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const numbersSchema = new Schema({
    number: {
        type: Number,
        required: true,
        unique: true
    },
    status: {
        type: String,
        default: "libre"
    },
    assignedTo: {
        type: String,
        default: ""
    }
});

module.exports = mongoose.model('Number', numbersSchema);


