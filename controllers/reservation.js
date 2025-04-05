const Reservation = require('../models/Reservation');
const Restaurant = require('../models/Restaurant');
const ReservationHistory = require('../models/ReservationHistory');

// @desc    Get all reservations (own if user, all if admin)
// @route   GET /api/reservations
// @access  Private
exports.getReservations = async (req, res) => {
    try {
        const query = req.user.role === 'admin' ? {} : { userId: req.user._id };

        const reservations = await Reservation.find(query).populate('restaurantId');
        res.status(200).json({ 
            success: true, 
            count: reservations.length, 
            data: reservations 
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: `Server error` 
        });
    }
};

// @desc    Get single reservation
// @route   GET /api/reservations/:id
// @access  Private
exports.getReservation = async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id).populate('restaurantId');
        if (!reservation) {
            return res.status(404).json({ 
                success: false, 
                message: `Reservation not found` 
            });
        }

        if (req.user.role !== 'admin' && reservation.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                success: false, 
                message: `Not authorized` 
            });
        }

        res.status(200).json({ 
            success: true, 
            data: reservation 
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// @desc    Create reservation
// @route   POST /api/reservations
// @access  Private/User
exports.createReservation = async (req, res) => {
    try {
        const { restaurantId, date, time, numOfGuests } = req.body;

        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ 
                success: false, 
                message: `Restaurant not found` 
            });
        }

        // Check if user already has 3 reservations today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const userReservationsCount = await Reservation.countDocuments({
            userId: req.user._id,
            date: { $gte: today, $lt: tomorrow },
            status: { $nin: ['canceled', 'deleted'] }
        });

        if (userReservationsCount >= 3) {
            return res.status(400).json({ 
                success: false, 
                message: `You can only make up to 3 reservations per day` 
            });
        }

        // Check if restaurant is full at this time
        const existingReservations = await Reservation.countDocuments({
            restaurantId,
            date,
            time,
            status: { $nin: ['canceled', 'deleted'] }
        });

        if (existingReservations >= restaurant.totalTables) {
            return res.status(400).json({ 
                success: false, 
                message: `Time slot is fully booked` 
            });
        }

        const reservation = await Reservation.create({
            restaurantId,
            userId: req.user._id,
            date,
            time,
            numOfGuests,
            status: 'confirmed',
            createdBy: req.user._id
        });

        await ReservationHistory.create({
            reservationId: reservation._id,
            userId: req.user._id,
            action: 'created',
            description: reservation,
        });

        res.status(201).json({ 
            success: true, 
            data: reservation 
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// @desc    Update reservation
// @route   PUT /api/reservations/:id
// @access  Private
exports.updateReservation = async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({ 
                success: false, 
                message: `Reservation not found` 
            });
        }

        // If time, date, or restaurantId is changing, check table availability
        const { date, time, restaurantId } = req.body;
        const restaurantChanged = restaurantId && restaurantId.toString() !== reservation.restaurantId.toString();
        const dateChanged = date && date !== reservation.date.toISOString().split('T')[0];
        const timeChanged = time && time !== reservation.time;

        if (restaurantChanged || dateChanged || timeChanged) {
            const checkRestaurantId = restaurantChanged ? restaurantId : reservation.restaurantId;
            const restaurant = await Restaurant.findById(checkRestaurantId);
            if (restaurant) {
                const existingReservations = await Reservation.countDocuments({
                    restaurantId: restaurant._id,
                    date: date || reservation.date,
                    time: time || reservation.time,
                    status: { $nin: ['canceled', 'deleted'] },
                    _id: { $ne: reservation._id }
                });

                if (existingReservations >= restaurant.totalTables) {
                    return res.status(400).json({ 
                        success: false, 
                        message: `Time slot is fully booked` 
                    });
                }
            }
        }

        const updated = await Reservation.findByIdAndUpdate(req.params.id, {
            ...req.body,
            updatedAt: Date.now(),
            updatedBy: req.user._id
        }, { new: true, runValidators: true });

        await ReservationHistory.create({
            reservationId: updated._id,
            userId: req.user._id,
            action: 'updated',
            description: updated,
        });

        res.status(200).json({ 
            success: true, 
            data: updated 
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: `Server error` 
        });
    }
};

// @desc    Cancel reservation (soft delete)
// @route   DELETE /api/reservations/:id
// @access  Private
exports.cancelReservation = async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({ 
                success: false, 
                message: `Reservation not found` 
            });
        }

        if (req.user.role !== 'admin' && reservation.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                success: false, 
                message: `Not authorized` 
            });
        }

        reservation.status = req.user.role === 'admin' ? 'deleted' : 'canceled';
        reservation.updatedAt = Date.now();
        reservation.updatedBy = req.user._id;
        await reservation.save();

        await ReservationHistory.create({
            reservationId: reservation._id,
            userId: req.user._id,
            action: reservation.status,
            description: reservation,
        });

        res.status(200).json({ 
            success: true, 
            message: `Reservation ${reservation.status}` 
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: `Server error` 
        });
    }
};
