const express = require('express');
const { addHoliday } = require('../controllers/holiday');

const router = express.Router();

const {protect,authorize} = require('../middleware/auth');

router.post('/', protect, authorize('admin'), addHoliday);

module.exports = router;