const express = require('express');
const { getUserProfile, updateUserProfile, getUsers, getUser, updateUser, deleteUser } = require('../controllers/user');

const router = express.Router();

const {protect,authorize} = require('../middleware/auth');

router.route('/me')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

router.route('/')
    .get(protect, authorize('admin'), getUsers);
router.route('/:userId')
    .get(protect, authorize('admin'), getUser)
    .put(protect, authorize('admin'), updateUser)
    .delete(protect, authorize('admin'), deleteUser);

module.exports = router;