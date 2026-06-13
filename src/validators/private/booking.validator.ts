import { body, param, query } from 'express-validator';

export const mongoIdParamValidator = (paramName: string = 'id') => [
  param(paramName).isMongoId().withMessage(`Invalid ${paramName} format`),
];

export const bookingQueryValidator = [
  query('status')
    .optional()
    .isIn(['pending', 'confirmed', 'completed', 'cancelled', 'reschedule_requested', 'rescheduled'])
    .withMessage('Invalid booking status filter'),
];

export const requestRescheduleValidator = [
  ...mongoIdParamValidator('bookingId'),
  body('newAvailabilityId')
    .notEmpty()
    .withMessage('New availability ID is required')
    .isMongoId()
    .withMessage('New availability ID must be a valid Mongo ID'),
  body('reason')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 500 })
    .withMessage('Reason must be between 3 and 500 characters'),
];
