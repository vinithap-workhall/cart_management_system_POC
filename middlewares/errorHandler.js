function errorHandler(err, req, res, next) {
  console.error(err);
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON format'
    });
  }
  if (err.isJoi) {
    return res.status(400).json({
      success: false,
      message: err.details[0].message
    });
  }
}

export  default errorHandler;