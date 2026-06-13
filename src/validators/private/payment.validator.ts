import { body } from 'express-validator';

export const createOrderValidator = [
  body('mentorId')
    .notEmpty()
    .withMessage('Mentor ID is required')
    .isMongoId()
    .withMessage('Mentor ID must be a valid Mongo ID'),

  body('packageId')
    .notEmpty()
    .withMessage('Package ID is required')
    .isMongoId()
    .withMessage('Package ID must be a valid Mongo ID'),

  body('availabilityId')
    .notEmpty()
    .withMessage('Availability ID is required')
    .isMongoId()
    .withMessage('Availability ID must be a valid Mongo ID'),
];

export const verifyPaymentValidator = [
  body('razorpayOrderId')
    .trim()
    .notEmpty()
    .withMessage('Razorpay order ID is required'),

  body('razorpayPaymentId')
    .trim()
    .notEmpty()
    .withMessage('Razorpay payment ID is required'),

  body('razorpaySignature')
    .trim()
    .notEmpty()
    .withMessage('Razorpay signature is required'),

  body('meetingData')
    .optional()
    .isObject()
    .withMessage('meetingData must be an object'),
  body('meetingData.roomId')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('roomId must be a non-empty string'),
  body('meetingData.provider')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('provider must be a non-empty string'),
  body('meetingData.meetingLink')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('meetingLink must be a non-empty string'),
  body('meetingData.hostLink')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('hostLink must be a non-empty string'),
];
