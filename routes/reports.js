const express = require('express');
const { getReservations, getRestaurantPerformance } = require('../controllers/report');

const router = express.Router();

const {protect,authorize} = require('../middleware/auth');

router.route('/reservations')
    .get(protect, authorize('admin'), getReservations);
router.route('/restaurant-performance')
    .get(protect, authorize('admin'), getRestaurantPerformance);

module.exports = router;