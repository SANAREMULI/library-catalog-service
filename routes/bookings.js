const express = require('express');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const { requireAuth, requireRole } = require('../middleware/auth');
const { isValidTimeRange } = require('../lib/fine');
const { createHttpError } = require('../middleware/validate');

const router = express.Router();

function parseBookingDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { space, date: dateValue, startTime, endTime } = req.body || {};
    const date = parseBookingDate(dateValue);
    if (typeof space !== 'string' || !space.trim() || !date || !isValidTimeRange(startTime, endTime)) {
      return next(createHttpError(400, 'Choose a space, a valid date, and an end time after the start time'));
    }

    const normalizedSpace = space.trim();
    // Times use zero-padded 24-hour HH:mm, so string comparisons are chronological.
    const overlap = await Booking.findOne({
      space: normalizedSpace,
      date,
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    });
    if (overlap) {
      return next(createHttpError(409, 'That time overlaps an existing booking for this space. Choose another time'));
    }

    const booking = await Booking.create({
      space: normalizedSpace,
      user: req.user._id,
      date,
      startTime,
      endTime,
    });
    await booking.populate('user', 'username email');
    return res.status(201).json({ booking });
  } catch (error) {
    return next(error);
  }
});

router.get('/', requireAuth, requireRole('librarian'), async (_req, res, next) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'username email')
      .sort({ date: 1, startTime: 1 });
    return res.status(200).json({ bookings });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
