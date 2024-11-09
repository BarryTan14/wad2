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
import mongoose from "mongoose";
import {svgUploadMiddleware} from "../middleware/svgSanitizer.js";

const {pick} = pkg;

const router = express.Router();

const baseDir = process.env.NODE_ENV === 'production'
    ? 'dist/profilepicture'
    : 'public/profilepicture';

const getUploadDir = () => {

    // Create directory if it doesn't exist
    if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir, { recursive: true });
    }

    return baseDir;
};


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Make sure this directory exists in your project
        cb(null, getUploadDir());
    },
    filename: function (req, file, cb) {
        // Generate random filename + timestamp while preserving the file extension
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

// jwt token encryption
const generateToken = (user) => {
    return jwt.sign(
        {userId: user._id, username: user.username},
        config.jwt.secret,
        config.jwt.options
    );
};

// sets the cookie token of the current req
const setCookieToken = (res, token) => {
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/' // Ensure cookie is available across all paths
    });
};

// asyncHandler in place of async ()
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// handles register with registration validation middleware using npm package
// automatically logs the user in after registration to save time
// originally wanted to do verification with email but required smtp and is complex
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
        user: pick(user, ['_id', 'displayName', 'profilePic', 'bio', 'role']) // Only send safe user data
    });
}));

// handles login
// sets cookie token
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
        user: pick(user, ['_id', 'displayName', 'profilePic', 'bio', 'role'])
    });
}));

// handles logout requests with an auth middleware so that anybody can't just log out anyone else.
// removes token cookie
router.post('/api/auth/logout', authMiddleware, (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
    });
    res.json({message: 'Logged out successfully'});
});

// Test route that was written to learn about auth middleware
// UNUSED (maybe)
router.get('/api/auth/test', authMiddleware, async (req, res) => {
    res.status(200).json({message: 'You have access to this protected resource',})
})

// Just checks the auth of user
router.get('/api/auth/check', authMiddleware, async (req, res) => {
    res.status(200).json({user: pick(req.user, ['_id', 'displayName', 'profilePic', 'bio', 'role', 'email', 'joinedGroups'])});
})

// Gets profile based on current user's token.
// Only able to get profile of current user, for other users, use profile/:id
router.get('/api/profile', authMiddleware, asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
        return res.status(404).json({message: 'User not found'});
    }
    res.json(pick(user, ['profilePic', 'displayName', 'bio', 'role', 'joinedGroups']));
}));

// Handles general info update like displayname bio and role.
// Other types of info update in future
const handleGeneralInfoUpdate = async (user, updates) => {
    const allowedUpdates = ['displayName', 'bio', 'role'];
    updates = pick(updates, allowedUpdates);

    Object.assign(user, updates);
    await user.save();
    return {message: 'Profile updated successfully'};
};

// Checks input password against current password so that someone who has a token but doesn't know the password can change it.
const handlePasswordUpdate = async (user, {currentPassword, newPassword}) => {
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        throw new Error('Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();
    return {message: 'Password updated successfully, please login again'};
};

// Handles updating of profile details
// uses Auth Middleware to get token and who's trying to edit their details, makes sure another user can't edit other users without correct auth
// validate middleware using validation package so that we don't have to write our own validator
// TODO: handle password updating and validation
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
        if(error.code === 11000)
            return res.status(400).json({message: 'That display name is already in use'});
        throw error;
    }
}));

// Handles picture uploading for profiles.
// Auth middleware to acquire token and who's trying to upload.
// svgUploadMiddleware to santize and optimize svg in case the user uploads an SVG (Don't want to block svg outright)
// Uploads profile picture as randomstring + timestamp to ensure no duplicates
// Does not delete the old picture for "caching"
router.post('/api/profile/picture',
    authMiddleware,
    upload.single('profilePic'),
    svgUploadMiddleware,  // Move after upload.single()
    asyncHandler(async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({message: 'No file uploaded'});
            }

            const user = await User.findById(req.user._id).select('-password');
            if (!user) {
                return res.status(404).json({message: 'User not found'});
            }

            // Update user's profile picture in database
            let oldPic = user.profilePic;
            user.profilePic = req.file.filename;
            await user.save();

            res.status(200).json({
                message: 'Profile picture uploaded successfully',
                user: pick(user, ['profilePic', 'displayName', 'bio', 'role', '_id', 'email'])
            });
        } catch (error) {
            // Delete uploaded file if any operation fails
            if (req.file) {
                const filePath = path.join(baseDir, req.file.filename);
                try {
                    await fs.promises.unlink(filePath);
                } catch (err) {
                    console.log('Error deleting file after failed upload:', err);
                }
            }
            throw error;
        }
    })
);

// Profile with :id parameter to search for specific ObjectID from mongodb. Returns ['profilePic','displayName','bio','role'] as an object, not as "user"
router.get('/api/profile/:id', authMiddleware, asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.json({profilePic:'server.png',displayName:'Unknown',bio:'Who am I? Who are you?'} );
    }

    const user = await User.findById(req.params.id)
        .select('-password')
        .lean();

    if (!user) {
        return res.json({profilePic:'server.png',displayName:'Unknown',bio:'An empty spot on the internet'} );
    }

    res.json(pick(user, ['profilePic', 'displayName', 'bio', 'role', 'email', 'joinedGroups']));
}));

router.get('/api/searchDisplayName/:displayName', authMiddleware, asyncHandler(async (req, res) => {
    const displayName = req.params.displayName;

    if(!displayName || displayName === '')
        return res.status(400).json({message: 'No display name provided'});

    const users = await User.find({ displayName: { $regex: displayName, $options: 'i' } })
        .select('_id displayName role email joinedGroups')
        .lean()

    if(!users || users.size === 0)
        return res.status(404).json({message: 'No users found.'});

    return res.status(200).json(users);
}));

router.post('/api/addMyselfToGroup/', authMiddleware, asyncHandler(async (req, res) => {
    const groupId = req.params.groupId;
    if(!groupId || groupId === '')
        return res.status(400).json({message: 'No group id provided'});
    const user = await User.find(req.user._id).select('-password');
    if(!user) {
        return res.status(400).json({message: 'No user found.'});
    }
    const group = await Group.findById(groupId);
    if(!group) {
        return res.status(400).json({message: 'No group found'});
    }
    try {
        user.joinedGroups.push(group._id)
        await user.save();
        return res.status(200).json({message: 'Group added'});
    } catch (e) {
        return res.status(500).json({message: 'Unable to add to group'});
    }
}));

router.post('/api/addToGroup/', authMiddleware, asyncHandler(async (req, res) => {
    const {displayName, groupId} = req.body
    if(!groupId || groupId === '')
        return res.status(400).json({message: 'No group id provided'});
    const user = await User.findOne(displayName).select('-password');
    if(!user) {
        return res.status(400).json({message: 'No user found.'});
    }
    const group = await Group.findById(groupId);
    if(!group) {
        return res.status(400).json({message: 'No group found'});
    }
    try {
        user.joinedGroups.push(group._id)
        await user.save();
        return res.status(200).json({message: 'Group added'});
    } catch (e) {
        return res.status(500).json({message: 'Unable to add to group'});
    }
}));

// Default error handling route which sends a json of error message and status code
router.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

export default router;
