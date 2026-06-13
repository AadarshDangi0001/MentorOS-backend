import { body, param } from 'express-validator';
import { UserRole, MentorStatus } from '../../types';

export const mongoIdParamValidator = (paramName: string = 'id') => [
  param(paramName).isMongoId().withMessage(`Invalid ${paramName} format`),
];

export const createMentorValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be 2-50 characters'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must include uppercase, lowercase, number, and special character'),

  body('mentorStatus')
    .optional()
    .isIn(Object.values(MentorStatus))
    .withMessage('Invalid mentor status'),

  body('isVerified')
    .optional()
    .isBoolean()
    .withMessage('isVerified must be a boolean'),

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

  body('experience')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Experience must be a non-negative integer'),

  body('currentRole')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Current role must be a string up to 100 characters'),

  body('company')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Company must be a string up to 100 characters'),

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

export const changeUserRoleValidator = [
  ...mongoIdParamValidator('id'),
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(Object.values(UserRole))
    .withMessage('Invalid user role'),
];

export const unblockUserValidator = [
  ...mongoIdParamValidator('id'),
  body('role')
    .optional()
    .isIn(Object.values(UserRole))
    .withMessage('Invalid user role'),
];
