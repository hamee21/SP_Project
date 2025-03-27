const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: [true, 'Please specify the restaurant']
    },
    date: {
        type: Date,
        required: [true, 'Please specify the holiday date']
    },
    description: {
        type: String,
        required: [true, 'Please add a description for the holiday']
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
});

module.exports = mongoose.model('Holiday', holidaySchema);