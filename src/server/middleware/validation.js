import {body, validationResult} from 'express-validator';

export const validateRegistration = [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('username').trim().isLength({ min: 3 }),
    validateRequest
];

export const validateLogin = [
    body('username').trim().notEmpty(),
    body('password').notEmpty(),
    validateRequest
];

export const validateProfileUpdate = [
    body('action').isIn(['generalInfo', 'password']),
    body('email').optional().isEmail().normalizeEmail(),
    body('displayName').optional().trim().notEmpty(),
    body('currentPassword').if(body('action').equals('password')).notEmpty(),
    body('newPassword').if(body('action').equals('password')).isLength({ min: 6 }),
    validateRequest
];

function validateRequest(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
}