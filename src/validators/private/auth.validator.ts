import { body } from 'express-validator';

export const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must include uppercase, lowercase, number, and special character')
    .custom((val, { req }) => {
      if (val === req.body.currentPassword)
        throw new Error('New password must differ from current');
      return true;
    }),
];

export const updateMeValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be 2-50 characters'),

  body('phone')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone number must be a valid string'),

  body('bio')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must be up to 500 characters'),

  body('avatar')
    .optional()
    .isString()
    .trim(),
];

