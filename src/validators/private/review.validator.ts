import { body, param } from 'express-validator';

export const mongoIdParamValidator = (paramName: string = 'id') => [
  param(paramName).isMongoId().withMessage(`Invalid ${paramName} format`),
];

export const submitReviewValidator = [
  body('bookingId')
    .notEmpty()
    .withMessage('Booking ID is required')
    .isMongoId()
    .withMessage('Booking ID must be a valid Mongo ID'),

  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),

  body('review')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Review must be up to 500 characters'),
];
