const express = require('express');
const router = express.Router();
const Genre = require('../models/Genre');
const Book = require('../models/Book');
const { validateGenre, createHttpError } = require('../middleware/validate');

router.get('/', async (req, res, next) => {
  try {
    const genres = await Genre.find().sort({ name: 1 });
    res.status(200).json(genres);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const genre = await Genre.findById(req.params.id);

    if (!genre) {
      return next(createHttpError(404, 'Genre not found'));
    }

    return res.status(200).json(genre);
  } catch (error) {
    if (error.name === 'CastError') {
      return next(createHttpError(400, 'Invalid Genre id'));
    }
    return next(error);
  }
});

router.post('/', validateGenre, async (req, res, next) => {
  try {
    const genre = await Genre.create(req.body);
    return res.status(201).json(genre);
  } catch (error) {
    if (error.code === 11000) {
      return next(createHttpError(400, 'Genre already exists'));
    }
    return next(error);
  }
});

router.put('/:id', validateGenre, async (req, res, next) => {
  try {
    const genre = await Genre.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!genre) {
      return next(createHttpError(404, 'Genre not found'));
    }

    return res.status(200).json(genre);
  } catch (error) {
    if (error.name === 'CastError') {
      return next(createHttpError(400, 'Invalid Genre id'));
    }
    if (error.code === 11000) {
      return next(createHttpError(400, 'Genre already exists'));
    }
    return next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const bookExists = await Book.exists({ genre: req.params.id });

    if (bookExists) {
      return next(createHttpError(400, 'Cannot delete a genre that is still assigned to books'));
    }

    const genre = await Genre.findByIdAndDelete(req.params.id);

    if (!genre) {
      return next(createHttpError(404, 'Genre not found'));
    }

    return res.status(204).send();
  } catch (error) {
    if (error.name === 'CastError') {
      return next(createHttpError(400, 'Invalid Genre id'));
    }
    return next(error);
  }
});

module.exports = router;
