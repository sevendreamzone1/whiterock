import type { ErrorRequestHandler } from 'express';

import logger from '../utils/logger';

interface HttpError extends Error {
  statusCode?: number;
}

const errorHandler: ErrorRequestHandler = (err: HttpError, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const response: { error: string; details?: string } = {
    error: statusCode === 500 ? 'Internal server error' : err.message,
  };

  if (process.env.NODE_ENV !== 'production') {
    response.details = err.message;
  }

  logger.error(err);
  res.status(statusCode).json(response);
};

export default errorHandler;
