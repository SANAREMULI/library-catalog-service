const mongoose = require('mongoose');
const Genre = require('../models/Genre');

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const ensureObjectBody = (req) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    throw createHttpError(400, 'Request body must be a JSON object');
  }
};

const validateRequiredString = (value, fieldName, { allowEmpty = false } = {}) => {
  if (value === undefined) {
    return `${fieldName} is required`;
  }

  if (typeof value !== 'string') {
    return `${fieldName} must be a string`;
  }

  const trimmed = value.trim();

  if (!allowEmpty && !trimmed) {
    return `${fieldName} is required`;
  }

  return null;
};

const validateGenre = async (req, res, next) => {
  try {
    ensureObjectBody(req);

    const { name, slug } = req.body;

    if (name !== undefined) {
      const nameError = validateRequiredString(name, 'name');
      if (nameError) {
        return next(createHttpError(400, nameError));
      }
      req.body.name = name.trim();
    }

    if (slug !== undefined) {
      const slugError = validateRequiredString(slug, 'slug');
      if (slugError) {
        return next(createHttpError(400, slugError));
      }
      req.body.slug = slug.trim().toLowerCase();
    }

    if (req.method === 'POST' && !req.body.name) {
      return next(createHttpError(400, 'name is required'));
    }

    if (req.method === 'POST' && !req.body.slug) {
      return next(createHttpError(400, 'slug is required'));
    }

    if (req.method === 'PUT' && req.body.slug !== undefined && !req.body.slug.trim()) {
      return next(createHttpError(400, 'slug is required'));
    }

    next();
  } catch (error) {
    next(error);
  }
};

const validateBook = async (req, res, next) => {
  try {
    ensureObjectBody(req);

    const validFields = ['title', 'author', 'isbn', 'description', 'coverImage', 'totalCopies', 'availableCopies', 'genre'];
    const invalidFields = Object.keys(req.body).filter((field) => !validFields.includes(field));

    if (invalidFields.length) {
      return next(createHttpError(400, `Unsupported field: ${invalidFields[0]}`));
    }

    const requiredOnCreate = ['title', 'author', 'isbn', 'totalCopies', 'availableCopies', 'genre'];

    for (const field of requiredOnCreate) {
      if (req.method === 'POST' && (req.body[field] === undefined || req.body[field] === null || req.body[field] === '')) {
        return next(createHttpError(400, `${field} is required`));
      }
    }

    if (req.body.title !== undefined) {
      const titleError = validateRequiredString(req.body.title, 'title');
      if (titleError) return next(createHttpError(400, titleError));
      req.body.title = req.body.title.trim();
    }

    if (req.body.author !== undefined) {
      const authorError = validateRequiredString(req.body.author, 'author');
      if (authorError) return next(createHttpError(400, authorError));
      req.body.author = req.body.author.trim();
    }

    if (req.body.isbn !== undefined) {
      const isbnError = validateRequiredString(req.body.isbn, 'isbn');
      if (isbnError) return next(createHttpError(400, isbnError));
      req.body.isbn = req.body.isbn.trim();
    }

    if (req.body.description !== undefined && typeof req.body.description !== 'string') {
      return next(createHttpError(400, 'description must be a string'));
    }

    if (req.body.coverImage !== undefined && typeof req.body.coverImage !== 'string') {
      return next(createHttpError(400, 'coverImage must be a string'));
    }

    if (req.body.totalCopies !== undefined) {
      if (typeof req.body.totalCopies !== 'number' || !Number.isFinite(req.body.totalCopies) || !Number.isInteger(req.body.totalCopies) || req.body.totalCopies < 0) {
        return next(createHttpError(400, 'totalCopies must be a non-negative integer'));
      }
    }

    if (req.body.availableCopies !== undefined) {
      if (typeof req.body.availableCopies !== 'number' || !Number.isFinite(req.body.availableCopies) || !Number.isInteger(req.body.availableCopies) || req.body.availableCopies < 0) {
        return next(createHttpError(400, 'availableCopies must be a non-negative integer'));
      }
    }

    if (req.body.totalCopies !== undefined && req.body.availableCopies !== undefined && req.body.availableCopies > req.body.totalCopies) {
      return next(createHttpError(400, 'availableCopies cannot exceed totalCopies'));
    }

    if (req.body.genre !== undefined) {
      if (typeof req.body.genre !== 'string' || !mongoose.Types.ObjectId.isValid(req.body.genre)) {
        return next(createHttpError(400, 'genre must be a valid Genre id'));
      }

      const genreExists = await Genre.exists({ _id: req.body.genre });
      if (!genreExists) {
        return next(createHttpError(400, 'genre must reference an existing Genre'));
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createHttpError,
  validateGenre,
  validateBook,
};
