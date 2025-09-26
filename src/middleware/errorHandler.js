// src/middleware/errorHandler.js
export function notFound(req, res, _next) {
  res.status(404).json({ message: `Not found: ${req.originalUrl}` });
}

export function errorHandler(err, _req, res, _next) {
  console.error('❌ Error:', err);
  const status = err.status || 500;
  const message = err.message || 'Server error';
  res.status(status).json({ message });
}