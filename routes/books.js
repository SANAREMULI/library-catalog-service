const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validateBook, createHttpError } = require('../middleware/validate');

router.get('/', async (req, res, next) => {
  try {
    const { genre, search, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (genre) {
      filter.genre = genre;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
      ];
    }

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.max(1, Number(limit) || 10);

    const [books, total] = await Promise.all([
      Book.find(filter)
        .populate('genre', 'name slug')
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
        .sort({ title: 1 }),
      Book.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / safeLimit));

    return res.status(200).json({
      data: books,
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id).populate('genre', 'name slug');

    if (!book) {
      return next(createHttpError(404, 'Book not found'));
    }

    return res.status(200).json(book);
  } catch (error) {
    if (error.name === 'CastError') {
      return next(createHttpError(400, 'Invalid Book id'));
    }
    return next(error);
  }
});

router.post('/', requireAuth, requireRole('librarian'), validateBook, async (req, res, next) => {
  try {
    const book = await Book.create(req.body);
    const populatedBook = await book.populate('genre', 'name slug');
    return res.status(201).json(populatedBook);
  } catch (error) {
    if (error.code === 11000) {
      return next(createHttpError(400, 'Book with that isbn already exists'));
    }
    return next(error);
  }
});

router.put('/:id', requireAuth, requireRole('librarian'), validateBook, async (req, res, next) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('genre', 'name slug');

    if (!book) {
      return next(createHttpError(404, 'Book not found'));
    }

    return res.status(200).json(book);
  } catch (error) {
    if (error.name === 'CastError') {
      return next(createHttpError(400, 'Invalid Book id'));
    }
    if (error.code === 11000) {
      return next(createHttpError(400, 'Book with that isbn already exists'));
    }
    return next(error);
  }
});

router.delete('/:id', requireAuth, requireRole('librarian'), async (req, res, next) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);

    if (!book) {
      return next(createHttpError(404, 'Book not found'));
    }

    return res.status(204).send();
  } catch (error) {
    if (error.name === 'CastError') {
      return next(createHttpError(400, 'Invalid Book id'));
    }
    return next(error);
  }
});

module.exports = router;
