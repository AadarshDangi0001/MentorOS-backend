import { param, query } from 'express-validator';

export const mongoIdParamValidator = (paramName: string = 'id') => [
  param(paramName).isMongoId().withMessage(`Invalid ${paramName} format`),
];

export const exploreQueryValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be a positive integer between 1 and 1000'),

  query('search')
    .optional()
    .isString()
    .trim(),

  query('expertise')
    .optional()
    .isString()
    .trim(),
];
