const mongoose = require('mongoose');

const RestaurantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a restaurant name'],
        trim: true
    },
    address: {
        type: String,
        required: [true, 'Please add an address']
    },
    telephone: {
        type: String,
        required: [true, 'Please add a telephone number']
    },
    openTime: {
        type: String,
        required: [true, 'Please specify the opening time']
    },
    closeTime: {
        type: String,
        required: [true, 'Please specify the closing time']
    },
    totalTables: {
        type: Number,
        required: [true, 'Please specify the total number of tables'],
        min: [1, 'Total tables must be at least 1']
    },
    location: {
        latitude: {
            type: Number,
            required: [true, 'Please add latitude']
        },
        longitude: {
            type: Number,
            required: [true, 'Please add longitude']
        }
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

module.exports = mongoose.model('Restaurant', RestaurantSchema);