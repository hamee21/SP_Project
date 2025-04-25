/**
* @swagger
* tags:
*   name: Holidays
*   description: The holidays managing API
*/

/**
* @swagger
* /holidays:
*   get:
*     summary: Returns the list of all holidays
*     tags: [Holidays]
*     responses:
*       200:
*         description: The list of holidays
*         content:
*           application/json:
*             schema:
*               type: array
*               items:
*                 $ref: '#/components/schemas/Holiday'
*/

/**
* @swagger
* /holidays/{id}:
*   get:
*     summary: Get the holiday by id
*     tags: [Holidays]
*     parameters:
*       - in: path
*         name: id
*         schema:
*           type: string
*         required: true
*         description: The holiday id
*     responses:
*       200:
*         description: The holiday by id
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/Holiday'
*       404:
*         description: The holiday was not found
*/

/**
* @swagger
* /holidays:
*   post:
*     summary: Create a new holiday
*     tags: [Holidays]
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/components/schemas/Holiday'
*     responses:
*       201:
*         description: The holiday was successfully created
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/Holiday'
*       500:
*         description: Some server error
*/

/**
* @swagger
* /holidays/{id}:
*   put:
*     summary: Update the holiday by the id
*     tags: [Holidays]
*     parameters:
*       - in: path
*         name: id
*         schema:
*           type: string
*         required: true
*         description: The holiday id
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/components/schemas/Holiday'
*     responses:
*       200:
*         description: The holiday was updated
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/Holiday'
*       404:
*         description: The holiday was not found
*       500:
*         description: Some error happened
*/

/**
* @swagger
* /holidays/{id}:
*   delete:
*     summary: Remove the holiday by id
*     tags: [Holidays]
*     parameters:
*       - in: path
*         name: id
*         schema:
*           type: string
*         required: true
*         description: The holiday id
*     responses:
*       200:
*         description: The holiday was deleted
*       404:
*         description: The holiday was not found
*/

/**
* @swagger
* components:
*   schemas:
*     Holiday:
*       type: object
*       required:
*         - name
*         - date
*       properties:
*         id:
*           type: string
*           format: uuid
*           description: The auto-generated id of the holiday
*           example: e4eaaaf2-d142-11e1-b3e4-080027620cdd
*         name:
*           type: string
*           description: Holiday name
*           example: Songkran Festival
*         date:
*           type: string
*           format: date
*           description: Date of the holiday
*           example: 2025-04-13
*         description:
*           type: string
*           description: Optional description of the holiday
*           example: Thai New Year celebration
*/

const express = require('express');
const { getRestaurants, getRestaurant, createRestaurant, updateRestaurant, deleteRestaurant, getRestaurantLocation, getRestaurantAvailability, getHolidays, getHoliday, createHoliday, updateHoliday, deleteHoliday } = require('../controllers/restaurant');

const router = express.Router();

const {protect,authorize} = require('../middleware/auth');

router.route('/')
    .get(getRestaurants)
    .post(protect, authorize('admin'), createRestaurant);
router.route('/:id')
    .get(getRestaurant)
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