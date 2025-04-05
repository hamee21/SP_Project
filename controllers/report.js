const Reservation = require('../models/Reservation');
const Restaurant = require('../models/Restaurant');

// @desc    Get reservation summary by restaurant and date range
// @route   GET /api/reports/reservations?start=YYYY-MM-DD&end=YYYY-MM-DD
// @access  Private/Admin
exports.getReservations = async (req, res) => {
    try {
        const { start, end } = req.query;

        if (!start || !end) {
            return res.status(400).json({ success: false, message: 'Please provide start and end date in YYYY-MM-DD format' });
        }

        const startDate = new Date(start);
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);

        const report = await Reservation.aggregate([
            {
                $match: {
                    date: { $gte: startDate, $lte: endDate },
                    status: { $nin: ['deleted'] }
                }
            },
            {
                $group: {
                    _id: '$restaurantId',
                    totalReservations: { $sum: 1 },
                    confirmed: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
                    canceled: { $sum: { $cond: [{ $eq: ['$status', 'canceled'] }, 1, 0] } },
                    completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
                }
            },
            {
                $lookup: {
                    from: 'restaurants',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'restaurant'
                }
            },
            {
                $unwind: '$restaurant'
            },
            {
                $project: {
                    restaurantName: '$restaurant.name',
                    totalReservations: 1,
                    confirmed: 1,
                    canceled: 1,
                    completed: 1
                }
            }
        ]);

        res.status(200).json({ success: true, data: report });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get top performing restaurants by number of reservations (filter by month/year)
// @route   GET /api/reports/restaurant-performance?month=4&year=2025
// @access  Private/Admin
exports.getRestaurantPerformance = async (req, res) => {
    try {
        const { month, year } = req.query;
        let match = { status: { $nin: ['deleted'] } };

        if (month && year) {
            const start = new Date(year, month - 1, 1);
            const end = new Date(year, month, 0);
            end.setHours(23, 59, 59, 999);
            match.date = { $gte: start, $lte: end };
        }

        const report = await Reservation.aggregate([
            {
                $match: match
            },
            {
                $group: {
                    _id: '$restaurantId',
                    totalReservations: { $sum: 1 }
                }
            },
            {
                $sort: { totalReservations: -1 }
            },
            {
                $lookup: {
                    from: 'restaurants',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'restaurant'
                }
            },
            {
                $unwind: '$restaurant'
            },
            {
                $project: {
                    restaurantName: '$restaurant.name',
                    totalReservations: 1
                }
            }
        ]);

        res.status(200).json({ success: true, data: report });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
