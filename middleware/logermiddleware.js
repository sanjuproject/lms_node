// logMiddleware.js
const logger = require('../logger');

// Create a stream object with a 'write' function to pass the log message to winston
const stream = {
  write: (message) => logger.info(message.trim())
};

// Middleware to log request details
const requestLogger = (req, res, next) => {
  logger.info(`Request: ${req.method} ${req.originalUrl}`);
  logger.info(`Headers: ${JSON.stringify(req.headers)}`);
  if (Object.keys(req.query).length) {
    //logger.info(`Query Params: ${JSON.stringify(req.query)}`);
  }
  if (Object.keys(req.body).length) {
    //logger.info(`Body Params: ${JSON.stringify(req.body)}`);
  }
  next();
};

// Middleware to log response body
const responseLogger = (req, res, next) => {
  const originalSend = res.send;
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.send = function (body) {
    logger.info(`Response: ${JSON.stringify(body)}`);
    originalSend.call(this, body);
  };
  next();
};

module.exports = {
  requestLogger,
  responseLogger
};
