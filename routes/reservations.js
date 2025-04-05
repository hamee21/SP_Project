const express = require('express');
const { getReservations, getReservation, createReservation, updateReservation, cancelReservation } = require('../controllers/reservation');

const router = express.Router();

const {protect,authorize} = require('../middleware/auth');

router.route('/')
    .get(protect, getReservations)
    .post(protect, authorize('user'), createReservation);
router.route('/:id')
    .get(protect, getReservation)
    .put(protect, updateReservation)
    .delete(protect, cancelReservation);

module.exports = router;