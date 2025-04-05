const express = require('express');
const { getRestaurants, getRestaurant, createRestaurant, updateRestaurant, deleteRestaurant, getRestaurantLocation, getRestaurantAvailability, getHolidays, getHoliday, createHoliday, updateHoliday, deleteHoliday } = require('../controllers/restaurant');

const router = express.Router();

const {protect,authorize} = require('../middleware/auth');

router.route('/')
    .get(getRestaurants)
    .post(protect, authorize('admin'), createRestaurant);
router.route('/:id')
    .get(protect, getRestaurant)
    .put(protect, authorize('admin'), updateRestaurant)
    .delete(protect, authorize('admin'), deleteRestaurant);
router.route('/:id/location')
    .get(getRestaurantLocation);
router.route('/:id/availability')
    .get(protect, getRestaurantAvailability);
router.route('/:id/holiday')
    .get(getHolidays)
    .post(protect, authorize('admin'), createHoliday);
router.route('/:id/holiday/:holidayId')
    .get(protect, authorize('admin'), getHoliday)
    .put(protect, authorize('admin'), updateHoliday)
    .delete(protect, authorize('admin'), deleteHoliday);

module.exports = router;