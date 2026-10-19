const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();

const genreRoutes = require('./routes/genres');
const bookRoutes = require('./routes/books');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/genres', genreRoutes);
app.use('/books', bookRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  if (err.name === 'ValidationError') {
    const firstMessage = Object.values(err.errors || {})[0]?.message || 'Validation failed';
    return res.status(400).json({ error: firstMessage });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ error: `Invalid ${err.path || 'field'} value` });
  }

  if (statusCode >= 500) {
    return res.status(500).json({ error: 'Internal server error' });
  }

  return res.status(statusCode).json({ error: message });
});

module.exports = app;
