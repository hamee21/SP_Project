const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Please specify the user']
    },
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: [true, 'Please specify the restaurant']
    },
    date: {
        type: Date,
        required: [true, 'Please specify the reservation date']
    },
    time: {
        type: String,
        required: [true, 'Please specify the reservation time']
    },
    numOfGuests: {
        type: Number,
        required: [true, 'Please specify the number of guests'],
        min: [1, 'At least one guest is required']
    },
    status: {
        type: String,
        enum: ['confirmed', 'canceled', 'completed', 'deleted'],
        default: 'confirmed'
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

module.exports = mongoose.model('Reservation', ReservationSchema);