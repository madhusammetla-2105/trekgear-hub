export function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // SQLite constraint errors
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    if (err.message.includes('email')) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'A trekker with this email already exists'
      });
    }
    if (err.message.includes('tent_id') && err.message.includes('active')) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'This tent already has an active rental'
      });
    }
    return res.status(409).json({
      error: 'Conflict',
      message: 'Duplicate entry violates unique constraint'
    });
  }

  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    return res.status(409).json({
      error: 'Conflict',
      message: 'Referenced record does not exist or cannot be deleted due to existing relations'
    });
  }

  if (err.code === 'SQLITE_CONSTRAINT_CHECK') {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Value violates check constraint'
    });
  }

  // Default error
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    error: status === 500 ? 'Internal Server Error' : 'Error',
    message: status === 500 ? 'An unexpected error occurred' : message
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
}