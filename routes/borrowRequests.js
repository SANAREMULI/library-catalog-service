const express = require('express');
const mongoose = require('mongoose');
const Book = require('../models/Book');
const BorrowRequest = require('../models/BorrowRequest');
const { requireAuth, requireRole } = require('../middleware/auth');
const { calculateLateFine } = require('../lib/fine');
const { createHttpError } = require('../middleware/validate');

const router = express.Router();
const LOAN_DAYS = Math.max(1, Number.parseInt(process.env.LOAN_DAYS || '14', 10));
const FINE_PER_DAY = Math.max(0, Number(process.env.FINE_PER_DAY || '0.25'));

router.post('/', requireAuth, async (req, res, next) => {
  let reservedBookId;
  try {
    const bookId = req.body?.bookId || req.body?.book;
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return next(createHttpError(400, 'A valid bookId is required'));
    }

    // Reserve a copy atomically; concurrent requests cannot take the last copy twice.
    const book = await Book.findOneAndUpdate(
      { _id: bookId, availableCopies: { $gt: 0 } },
      { $inc: { availableCopies: -1 } },
      { new: true }
    );
    if (!book) {
      const exists = await Book.exists({ _id: bookId });
      return next(createHttpError(exists ? 409 : 404, exists ? 'No copies of this book are currently available' : 'Book not found'));
    }
    reservedBookId = book._id;

    const requestedAt = new Date();
    const dueAt = new Date(requestedAt.getTime() + LOAN_DAYS * 24 * 60 * 60 * 1000);
    const borrowRequest = await BorrowRequest.create({
      book: book._id,
      user: req.user._id,
      requestedAt,
      dueAt,
      status: 'pending',
      fine: 0,
    });
    await borrowRequest.populate([
      { path: 'book', populate: { path: 'genre', select: 'name slug' } },
      { path: 'user', select: 'username email' },
    ]);
    return res.status(201).json({ borrowRequest });
  } catch (error) {
    if (reservedBookId) {
      await Book.updateOne({ _id: reservedBookId }, { $inc: { availableCopies: 1 } }).catch(() => {});
    }
    return next(error);
  }
});

router.get('/', requireAuth, requireRole('librarian'), async (_req, res, next) => {
  try {
    const borrowRequests = await BorrowRequest.find()
      .populate({ path: 'book', select: 'title author isbn genre', populate: { path: 'genre', select: 'name slug' } })
      .populate('user', 'username email')
      .sort({ requestedAt: -1 });
    return res.status(200).json({ borrowRequests });
  } catch (error) {
    return next(error);
  }
});

router.patch('/:id', requireAuth, requireRole('librarian'), async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(createHttpError(404, 'Borrow request not found'));
    }
    const { status } = req.body || {};
    if (!['pending', 'approved', 'returned', 'late'].includes(status)) {
      return next(createHttpError(400, 'Status must be pending, approved, returned, or late'));
    }

    const borrowRequest = await BorrowRequest.findById(req.params.id);
    if (!borrowRequest) return next(createHttpError(404, 'Borrow request not found'));
    const wasReturned = borrowRequest.status === 'returned';
    borrowRequest.status = status;

    if (status === 'returned') {
      if (!wasReturned) {
        const returnedAt = new Date();
        borrowRequest.returnedAt = returnedAt;
        // Ignore any client-supplied fine: this value is always server-computed.
        borrowRequest.fine = calculateLateFine(borrowRequest.dueAt, returnedAt, FINE_PER_DAY);
        await Book.updateOne({ _id: borrowRequest.book }, { $inc: { availableCopies: 1 } });
      }
    } else {
      borrowRequest.returnedAt = null;
      borrowRequest.fine = 0;
      if (wasReturned) {
        const reserved = await Book.findOneAndUpdate(
          { _id: borrowRequest.book, availableCopies: { $gt: 0 } },
          { $inc: { availableCopies: -1 } },
          { new: true }
        );
        if (!reserved) return next(createHttpError(409, 'No available copy exists to reopen this borrow request'));
      }
    }

    await borrowRequest.save();
    await borrowRequest.populate([
      { path: 'book', select: 'title author isbn genre', populate: { path: 'genre', select: 'name slug' } },
      { path: 'user', select: 'username email' },
    ]);
    return res.status(200).json({ borrowRequest });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
