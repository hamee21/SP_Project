const User = require('../models/User');
const Reservation = require('../models/Reservation');

// @desc    Get current logged-in user's profile
// @route   GET /api/users/me
// @access  Private
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        res.status(200).json({ 
            success: true, 
            data: user 
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: `Server error`
        });
    }
};

// @desc    Update current user's profile
// @route   PUT /api/users/me
// @access  Private
exports.updateUserProfile = async (req, res) => {
    try {
        const fieldsToUpdate = {
            name: req.body.name,
            email: req.body.email,
            telephone: req.body.telephone,
            updatedAt: Date.now(),
            updatedBy: req.user._id,
        };

        const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
            new: true,
            runValidators: true,
        }).select('-password');

        res.status(200).json({
            success: true, 
            data: user 
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: `Server error` 
        });
    }
};

// @desc    Get all users (admin only)
// @route   GET /api/users/
// @access  Private/Admin
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        
        res.status(200).json({
            success: true, 
            count: users.length, 
            data: users 
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: `Server error`
        });
    }
};

// @desc    Get single user by ID (admin only)
// @route   GET /api/users/:userId
// @access  Private/Admin
exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false, 
                message: `User not found` 
            });
        }

        res.status(200).json({ 
            success: true, 
            data: user 
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: `Server error`
        });
    }
};

// @desc    Update user by ID (admin only)
// @route   PUT /api/users/:userId
// @access  Private/Admin
exports.updateUser = async (req, res) => {
    try {
        const fieldsToUpdate = {
            name: req.body.name,
            email: req.body.email,
            telephone: req.body.telephone,
            role: req.body.role,
            updatedAt: Date.now(),
            updatedBy: req.user._id,
        };

        const user = await User.findByIdAndUpdate(req.params.userId, fieldsToUpdate, {
            new: true,
            runValidators: true,
        }).select('-password');

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: `User not found` 
            });
        }

        res.status(200).json({ 
            success: true, 
            data: user 
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: `Server error` 
        });
    }
};

// @desc    Delete user by ID (admin only)
// @route   DELETE /api/users/:userId
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
    try {
        // ตรวจสอบว่าผู้ใช้มีรายการจองที่ยังไม่ยกเลิกหรือไม่
        const hasActiveReservation = await Reservation.exists({
            userId: req.params.userId,
            status: { $nin: ['canceled', 'deleted'] } // ตรวจเฉพาะที่ยัง active
        });

        if (hasActiveReservation) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete user with active reservations`,
            });
        }

        // ลบผู้ใช้ได้ถ้าไม่มีการจองค้างอยู่
        const user = await User.findByIdAndDelete(req.params.userId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: `User not found` 
            });
        }

        res.status(200).json({ 
            success: true, 
            message: `User deleted successfully` 
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: `Server error` 
        });
    }
};