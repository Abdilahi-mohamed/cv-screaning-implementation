const notFound = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.code === 'LIMIT_FILE_SIZE'
    ? 413
    : res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    message: err.code === 'LIMIT_FILE_SIZE'
      ? 'The uploaded file exceeds the current size limit.'
      : err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

module.exports = { notFound, errorHandler };
