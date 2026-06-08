import { body } from 'express-validator';

export const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must include uppercase, lowercase, number, and special character')
    .custom((val, { req }) => {
      if (val === req.body.currentPassword) throw new Error('New password must differ from current');
      return true;
    }),
];
