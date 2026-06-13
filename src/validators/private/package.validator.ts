import { body, param } from 'express-validator';

export const mongoIdParamValidator = (paramName: string = 'id') => [
  param(paramName).isMongoId().withMessage(`Invalid ${paramName} format`),
];

export const createPackageValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Title must be between 2 and 100 characters'),

  body('duration')
    .notEmpty()
    .withMessage('Duration is required')
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer (in minutes)'),

  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isInt({ min: 0 })
    .withMessage('Price must be a non-negative integer (in paise)'),

  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be up to 500 characters'),
];

export const updatePackageValidator = [
  ...mongoIdParamValidator('id'),

  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Title must be between 2 and 100 characters'),

  body('duration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer (in minutes)'),

  body('price')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Price must be a non-negative integer (in paise)'),

  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be up to 500 characters'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];
