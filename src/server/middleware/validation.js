import {body, validationResult} from 'express-validator';

export const validateRegistration = [
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please enter a valid email address')
        .normalizeEmail(),

    body('username')
        .notEmpty().withMessage('Username is required')
        .trim()
        .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers and underscores'),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
        .matches(/[0-9]/).withMessage('Password must contain at least one number'),

    validateRequest
];

export const validateLogin = [
    body('username').trim().notEmpty(),
    body('password').notEmpty(),
    validateRequest
];

export const validateProfileUpdate = [
    body('action').isIn(['generalInfo', 'password']),
    body('email')
        .optional()
        .isEmail().withMessage('Please enter a valid email address')
        .normalizeEmail(),
    body('displayName')
        .optional()
        .trim()
        .notEmpty(),
    body('role')
        .optional()
        .trim()
        .notEmpty(),
    body('currentPassword')
        .if(body('action').equals('password'))
        .notEmpty(),
    body('newPassword')
        .if(body('action').equals('password'))
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
        .matches(/[0-9]/).withMessage('Password must contain at least one number'),
    validateRequest
];

function validateRequest(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
}