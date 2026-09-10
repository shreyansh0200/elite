export function errorHandler(err, _req, res, _next) {
  console.error(err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: 'Invalid request data' });
  }

  if (err.code === 11000) {
    return res.status(409).json({ message: 'A record with that value already exists' });
  }

  if (err.message === 'Origin is not allowed by CORS') {
    return res.status(403).json({ message: err.message });
  }

  return res.status(err.status || 500).json({
    message: err.message || 'Server error',
  });
}
