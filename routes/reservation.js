const express = require('express');
const { createReservation, updateReservation, getUserReservations, cancelReservation } = require('../controllers/reservation');

const router = express.Router();

const {protect} = require('../middleware/auth');

router.route('/')
    .get(protect, getUserReservations)
    .post(protect, createReservation);
router.route('/:id')
    .put(protect, updateReservation)
    .delete(protect, cancelReservation);

module.exports = router;