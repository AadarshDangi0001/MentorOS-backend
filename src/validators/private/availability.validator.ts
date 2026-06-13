import { body, param } from 'express-validator';

export const mongoIdParamValidator = (paramName: string = 'id') => [
  param(paramName).isMongoId().withMessage(`Invalid ${paramName} format`),
];

export const createAvailabilityValidator = [
  body('startTime')
    .notEmpty()
    .withMessage('Start time is required')
    .isISO8601()
    .withMessage('Start time must be a valid ISO8601 date')
    .custom((val) => {
      if (new Date(val) < new Date()) {
        throw new Error('Start time must be in the future');
      }
      return true;
    }),

  body('endTime')
    .notEmpty()
    .withMessage('End time is required')
    .isISO8601()
    .withMessage('End time must be a valid ISO8601 date')
    .custom((val, { req }) => {
      const start = new Date(req.body.startTime);
      const end = new Date(val);
      if (isNaN(start.getTime())) {
        throw new Error('Valid start time must be provided first');
      }
      if (end <= start) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),
];
