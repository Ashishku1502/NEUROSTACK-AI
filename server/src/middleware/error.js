const { ZodError } = require('zod');

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const notFound = (req, res) => res.status(404).json({ error: 'Not found' });

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: err.issues.map((i) => i.message).join(', ') });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File is too large. The limit is 10 MB.' });
  }
  if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid id' });
  console.error('[error]', err);
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Something went wrong on the server' });
};

module.exports = { asyncHandler, notFound, errorHandler };
