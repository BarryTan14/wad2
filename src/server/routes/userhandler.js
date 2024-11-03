import express from 'express';
import bcrypt from "bcrypt";
import {User} from "../models/User.js";
import jwt from "jsonwebtoken";
import config from '../config/secrets.js'
import {authMiddleware} from "../middleware/auth.js";
import {validateLogin, validateProfileUpdate, validateRegistration} from '../middleware/validation.js';
import pkg from 'lodash';
import fs from 'fs';
import path from "path";
import multer from "multer";
import crypto from 'crypto';
import {dirname} from 'path'

const {pick} = pkg;

const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Make sure this directory exists in your project
        cb(null, 'src/client/assets/profilepicture/');
    },
    filename: function (req, file, cb) {
        // Generate random filename while preserving the file extension
        const randomName = crypto.randomBytes(16).toString('hex') + Date.now().toString();
        const fileExt = path.extname(file.originalname).toLowerCase();
        cb(null, randomName + fileExt);
    }
});

const fileFilter = (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload an image file.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: fileFilter
});

const generateToken = (user) => {
    return jwt.sign(
        {userId: user._id, username: user.username},
        config.jwt.secret,
        config.jwt.options
    );
};

const setCookieToken = (res, token) => {
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/' // Ensure cookie is available across all paths
    });
};

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};


router.put('/api/auth/register', validateRegistration, asyncHandler(async (req, res) => {
    const {email, password, username, captcha} = req.body;

    if (captcha !== req.session.captcha) {
        return res.status(400).json({message: 'Invalid captcha'});
    }

    // Check existing users (using Promise.all for parallel execution)
    const [existingNameUser, existingEmailUser] = await Promise.all([
        User.findOne({username}),
        User.findOne({email})
    ]);

    if (existingNameUser) {
        return res.status(400).json({message: 'Username already taken'});
    }
    if (existingEmailUser) {
        return res.status(400).json({message: 'Email already registered'});
    }

    const user = new User({email, password, username});
    await user.save();

    const token = generateToken(user);
    setCookieToken(res, token);

    res.status(201).json({
        message: 'Registration successful',
        user: pick(user, ['_id', 'username', 'email']) // Only send safe user data
    });
}));

router.post('/api/auth/login', validateLogin, asyncHandler(async (req, res) => {
    const {username, password, captcha} = req.body;

    if (captcha !== req.session.captcha) {
        return res.status(400).json({message: 'Invalid captcha'});
    }

    const user = await User.findOne({username}).select('+password'); // Explicitly select password
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({message: 'Invalid credentials'});
    }

    const token = generateToken(user);
    setCookieToken(res, token);

    res.json({
        message: 'Login successful',
        user: pick(user, ['_id', 'username', 'email'])
    });
}));


router.post('/api/auth/logout', authMiddleware, (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
    });
    res.json({message: 'Logged out successfully'});
});

router.get('/api/auth/test', authMiddleware, async (req, res) => {
    res.status(200).json({message: 'You have access to this protected resource',})
})

router.get('/api/auth/check', authMiddleware, async (req, res) => {
    res.status(200).json({user: pick(req.user, ['_id', 'displayName', 'profilePic', 'bio', 'role'])});
})

router.get('/api/profile', authMiddleware, asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
        return res.status(404).json({message: 'User not found'});
    }
    res.json(pick(user, ['profilePic', 'displayName', 'bio', 'role']));
}));

const handleGeneralInfoUpdate = async (user, updates) => {
    const allowedUpdates = ['displayName', 'bio'];
    updates = pick(updates, allowedUpdates);

    Object.assign(user, updates);
    await user.save();
    return {message: 'Profile updated successfully'};
};

const handlePasswordUpdate = async (user, {currentPassword, newPassword}) => {
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        throw new Error('Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();
    return {message: 'Password updated successfully, please login again'};
};

router.put('/api/profile/update', authMiddleware, validateProfileUpdate, asyncHandler(async (req, res) => {
    const action = req.body.action;
    try {
        switch (action) {
            case 'generalInfo':
                const result = await handleGeneralInfoUpdate(req.user, req.body);
                return res.status(200).json({
                    message: result.message,
                    user: req.user
                });

            case 'password':
                const passwordResult = await handlePasswordUpdate(req.user, req.body);
                res.clearCookie('token', {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    path: '/'
                });
                return res.json(passwordResult);

            default:
                return res.status(400).json({message: 'Invalid action'});
        }
    } catch (error) {
        throw error;
    }
}));

router.post('/api/profile/picture', authMiddleware, upload.single('profilePic'), asyncHandler(async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({message: 'No file uploaded'});
        }

        // Get the user from your database
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({message: 'User not found'});
        }

        // Delete old profile picture if it exists
        if(user.profilePic!=="avatar.png")
        if (user.profilePic) {
            const oldPicPath = path.join('./src/client/assets/profilepicture/', user.profilePic);
            try {
                // Use fs.promises for better async handling
                await fs.promises.unlink(oldPicPath);
            } catch (err) {
                console.log('Error deleting old profile picture:', err);
                // Continue execution even if old file deletion fails
            }
        }

        // Update user's profile picture in database
        user.profilePic = req.file.filename;
        console.log(req.file.filename);
        await user.save();

        res.status(200).json({
            message: 'Profile picture uploaded successfully',
            profilePic: req.file.filename
        });
    } catch (error) {
        // Delete uploaded file if database operation fails
        if (req.file) {
            const filePath = path.join('./src/client/assets/profilepicture/', req.file.filename);
            try {
                await fs.promises.unlink(filePath);
            } catch (err) {
                console.log('Error deleting file after failed upload:', err);
            }
        }
        throw error;
    }
}));

router.get('/api/profile/:id', authMiddleware, asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)
        .select('displayName bio profilePic')
        .lean();

    if (!user) {
        return res.status(404).json({message: 'User not found'});
    }

    res.json(pick(user, ['profilePic', 'displayName', 'bio']));
}));

router.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

export default router;
