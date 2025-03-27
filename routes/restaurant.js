const express = require('express');
const { getRestaurants, createRestaurant, updateRestaurant, deleteRestaurant, getRestaurantLocation } = require('../controllers/restaurant');

const router = express.Router();

const {protect,authorize} = require('../middleware/auth');

router.route('/')
    .get(getRestaurants)
    .post(protect, authorize('admin'), createRestaurant);
router.route('/:id')
    .put(protect, authorize('admin'), updateRestaurant)
    .delete(protect, authorize('admin'), deleteRestaurant);
router.route('/:id/location')
    .get(getRestaurantLocation);

module.exports = router;