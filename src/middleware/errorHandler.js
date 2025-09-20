export function notFound(req, res, _next) {
  const err = new Error(`Not Found - ${req.originalUrl}`);
  err.status = 404;
  res.status(404).json({ message: err.message });
}

export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  if (process.env.NODE_ENV !== 'test') {
    console.error('Error:', err);
  }
  res.status(status).json({
    message: err.message || 'Server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}