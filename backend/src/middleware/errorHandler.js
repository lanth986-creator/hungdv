export const errorHandler = (err, req, res, _next) => {
  console.error('Error:', err.message);
  console.error(err.stack);

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const notFound = (req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
};
