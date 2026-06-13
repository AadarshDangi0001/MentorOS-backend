import { body } from 'express-validator';

export const updateMentorProfileValidator = [
  body('company')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Company name must be a string up to 100 characters'),

  body('currentRole')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Current role must be a string up to 100 characters'),

  body('experience')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Experience must be a non-negative integer'),

  body('expertise')
    .optional()
    .isArray()
    .withMessage('Expertise must be an array of strings'),
  body('expertise.*')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Expertise items must be non-empty strings'),

  body('linkedIn')
    .optional()
    .custom((val) => {
      if (val === '') return true;
      if (typeof val === 'string' && val.startsWith('http')) return true;
      throw new Error('LinkedIn must be a valid URL');
    }),

  body('github')
    .optional()
    .custom((val) => {
      if (val === '') return true;
      if (typeof val === 'string' && val.startsWith('http')) return true;
      throw new Error('GitHub must be a valid URL');
    }),

  body('hourlyRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Hourly rate must be a non-negative number'),

  body('languages')
    .optional()
    .isArray()
    .withMessage('Languages must be an array of strings'),
  body('languages.*')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Languages items must be non-empty strings'),
];
