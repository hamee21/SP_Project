const mongoose = require('mongoose');

const reservationHistorySchema = new mongoose.Schema({
    reservationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reservation',
        required: [true, 'Please specify the reservation']
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Please specify the user']
    },
    action: {
        type: String,
        enum: ['created', 'updated', 'canceled', 'completed', 'deleted'],
        required: [true, 'Please specify the action type']
    },
    description: {
        type: Object,
        required: [true, 'Please provide description of the action']
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ReservationHistory', reservationHistorySchema);