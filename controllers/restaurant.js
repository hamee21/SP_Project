const Restaurant = require('../models/Restaurant');
const Reservation = require('../models/Reservation');
const Holiday = require('../models/Holiday');

const generateTimeSlots = (start, end) => {
    const slots = [];
    const [startHour] = start.split(':').map(Number);
    const [endHour] = end.split(':').map(Number);

    for (let hour = startHour; hour < endHour; hour++) {
        const h = hour.toString().padStart(2, '0');
        slots.push(`${h}:00`);
    }

    return slots;
};

// @desc    Get all restaurants (with filter, sort, select, pagination)
// @route   GET /api/restaurants
// @access  Public
exports.getRestaurants = async (req, res) => {
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude from filter
    const removeFields = ['select', 'sort', 'page', 'limit'];
    removeFields.forEach(param => delete reqQuery[param]);

    // Convert operators (gt, gte, lt, etc.)
    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Build initial query
    query = Restaurant.find(JSON.parse(queryStr));

    // Select specific fields
    if (req.query.select) {
        const fields = req.query.select.split(',').join(' ');
        query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else {
        query = query.sort('-createdAt'); // default: newest first
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Restaurant.countDocuments();

    query = query.skip(startIndex).limit(limit);

    try {
        const restaurants = await query;

        const pagination = {};
        if (endIndex < total) {
            pagination.next = {
                page: page + 1,
                limit
            };
        }

        if (startIndex > 0) {
            pagination.prev = {
                page: page - 1,
                limit
            };
        }

        res.status(200).json({
            success: true,
            count: restaurants.length,
            pagination,
            data: restaurants
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: `Server error`
        });
    }
};

// @desc    Get single restaurant
// @route   GET /api/restaurants/:id
// @access  Private
exports.getRestaurant = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);

        if (!restaurant) {
            return res.status(404).json({ 
                success: false, 
                message: `Restaurant not found` 
            });
        }

        res.status(200).json({ 
            success: true, 
            data: restaurant 
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: `Server error` 
        });
    }
};

// @desc    Create new restaurant
// @route   POST /api/restaurants
// @access  Private/Admin
exports.createRestaurant = async (req, res) => {
    try {
        req.body.createdBy = req.user._id;

        const restaurant = await Restaurant.create(req.body);
        res.status(201).json({ success: true, data: restaurant });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update restaurant
// @route   PUT /api/restaurants/:id
// @access  Private/Admin
exports.updateRestaurant = async (req, res) => {
    try {
        req.body.updatedAt = Date.now();
        req.body.updatedBy = req.user._id;

        const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!restaurant) {
            return res.status(404).json({ 
                success: false, 
                message: `Restaurant not found` 
            });
        }

        res.status(200).json({ 
            success: true, 
            data: restaurant 
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: `Server error` 
        });
    }
};

// @desc    Delete restaurant
// @route   DELETE /api/restaurants/:id
// @access  Private/Admin
exports.deleteRestaurant = async (req, res) => {
    try {
        const hasReservations = await Reservation.exists({
            restaurantId: req.params.id,
            status: { $nin: ['canceled', 'deleted'] }
        });

        if (hasReservations) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete restaurant with active reservations`
            });
        }

        const restaurant = await Restaurant.findByIdAndDelete(req.params.id);

        if (!restaurant) {
            return res.status(404).json({ 
                success: false, 
                message: `Restaurant not found` 
            });
        }

        res.status(200).json({ 
            success: true, 
            message: `Restaurant deleted successfully` 
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, message: `Server error` 
        });
    }
};

// @desc    Get restaurant location
// @route   GET /api/restaurants/:id/location
// @access  Public
exports.getRestaurantLocation = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id).select('location');
        if (!restaurant) {
            return res.status(404).json({ 
                success: false, 
                message: `Restaurant not found` 
            });
        }

        res.status(200).json({ 
            success: true, 
            location: restaurant.location 
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: `Server error` 
        });
    }
};

// @desc    Get restaurant availability by hour
// @route   GET /api/restaurants/:id/availability?date=YYYY-MM-DD
// @access  Private
exports.getRestaurantAvailability = async (req, res) => {
    try {
        const dateQuery = req.query.date;
        if (!dateQuery) {
            return res.status(400).json({ 
                success: false, 
                message: `Please provide a date in YYYY-MM-DD format` 
            });
        }

        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) {
            return res.status(404).json({ 
                success: false, 
                message: `Restaurant not found` 
            });
        }

        // Check if this date is a holiday
        const isHoliday = await Holiday.exists({
            restaurantId: restaurant._id,
            date: new Date(dateQuery)
        });
        if (isHoliday) {
            return res.status(200).json({ 
                success: true, 
                date: dateQuery, 
                availability: [], 
                message: `Restaurant is closed on this day (holiday)` });
        }

        // Generate time slots (e.g., 10:00 to 21:00)
        const timeSlots = generateTimeSlots(restaurant.openTime, restaurant.closeTime);
        const availability = [];

        for (const time of timeSlots) {
            const reservationCount = await Reservation.countDocuments({
                restaurantId: restaurant._id,
                date: new Date(dateQuery),
                time: time,
                status: { $nin: ['canceled', 'deleted'] }
            });

            availability.push({
                time,
                available: reservationCount < restaurant.totalTables
            });
        }

        res.status(200).json({ 
            success: true, 
            date: dateQuery, 
            availability 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ 
            success: false, 
            message: `Server error` 
        });
    }
};

// @desc    Get holidays for a restaurant
// @route   GET /api/restaurants/:id/holiday
// @access  Public
exports.getHolidays = async (req, res) => {
    try {
        const holidays = await Holiday.find({ restaurantId: req.params.id });
        res.status(200).json({ 
            success: true, 
            count: holidays.length, 
            data: holidays 
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: `Server error` 
        });
    }
};

// @desc    Get single holiday
// @route   GET /api/restaurants/:id/holiday/:holidayId
// @access  Public
exports.getHoliday = async (req, res) => {
    try {
        const holiday = await Holiday.findOne({
            _id: req.params.holidayId,
            restaurantId: req.params.id
        });

        if (!holiday) {
            return res.status(404).json({ 
                success: false, 
                message: `Holiday not found` 
            });
        }

        res.status(200).json({ 
            success: true, 
            data: holiday 
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: `Server error` 
        });
    }
};

// @desc    Create holiday
// @route   POST /api/restaurants/:id/hodiday
// @access  Private/Admin
exports.createHoliday = async (req, res) => {
    try {
        const { date, description } = req.body;

        // ตรวจสอบว่ามี holiday ซ้ำ
        const existing = await Holiday.exists({
            restaurantId: req.params.id,
            date: new Date(date)
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: `This date is already marked as a holiday for this restaurant`
            });
        }

        // ตรวจสอบว่ามี reservation ในวันนั้นอยู่ไหม
        const hasReservation = await Reservation.exists({
            restaurantId: req.params.id,
            date: new Date(date),
            status: { $nin: ['canceled', 'deleted'] }
        });

        if (hasReservation) {
            return res.status(400).json({
                success: false,
                message: `Cannot set holiday on a date that has active reservations`
            });
        }

        const holiday = await Holiday.create({
            restaurantId: req.params.id,
            date,
            description,
            createdBy: req.user._id
        });

        res.status(201).json({ 
            success: true, 
            data: holiday 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ 
            success: false, 
            message: `Server error` 
        });
    }
};

// @desc    Update holiday
// @route   PUT /api/restaurants/:id/holiday/:holidayId
// @access  Private/Admin
exports.updateHoliday = async (req, res) => {
    try {
        const { description } = req.body;
        const updateFields = {
            description,
            updatedAt: Date.now(),
            updatedBy: req.user._id
        };

        const holiday = await Holiday.findOneAndUpdate(
            {
                _id: req.params.holidayId,
                restaurantId: req.params.id
            },
            updateFields,
            {
                new: true,
                runValidators: true
            }
        );

        if (!holiday) {
            return res.status(404).json({ 
                success: false, 
                message: `Holiday not found` 
            });
        }

        res.status(200).json({ 
            success: true, 
            data: holiday 
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: `Server error` });
    }
};

// @desc    Delete a specific holiday
// @route   DELETE /api/restaurants/:id/holiday/:holidayId
// @access  Private/Admin
exports.deleteHoliday = async (req, res) => {
    try {
        const holiday = await Holiday.findOneAndDelete({
            _id: req.params.holidayId,
            restaurantId: req.params.id
        });

        if (!holiday) {
            return res.status(404).json({ 
                success: false, 
                message: `Holiday not found` 
            });
        }

        res.status(200).json({ 
            success: true, 
            message: `Holiday deleted successfully` 
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: `Server error` 
        });
    }
};