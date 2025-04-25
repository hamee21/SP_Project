const express = require('express');
const { getReservations, getRestaurantPerformance } = require('../controllers/report');

const router = express.Router();

const {protect,authorize} = require('../middleware/auth');

router.route('/reservations')
    .get(getReservations);
router.route('/restaurant-performance')
    .get( getRestaurantPerformance);

module.exports = router;