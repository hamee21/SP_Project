const express = require('express');
const { getUserProfile, updateUserProfile, getUsers, getUser } = require('../controllers/user');

const router = express.Router();

const {protect,authorize} = require('../middleware/auth');

router.route('/me')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

router.route('/')
    .get(protect, getUsers);
router.route('/:userId')
    .get(protect, getUser);

module.exports = router;