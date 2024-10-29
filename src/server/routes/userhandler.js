import express from 'express';
import db from "../db/conn.js";
import bcrypt from "bcrypt";
import {User} from "../models/User.js";
import jwt from "jsonwebtoken";
import config from '../config/secrets.js'
import {authMiddleware} from "../middleware/auth.js";
import StringUtils from 'is-empty-null-undef-nan-whitespace';
import {guestMiddleware} from "../middleware/guest.js";

const router = express.Router();

const generateToken = (user) => {
    return jwt.sign(
        {userId: user._id, username: user.username},
        config.jwt.secret,
        config.jwt.options
    )
}

router.put('/api/auth/register', async (req, res) => {
    const {email, password, username, captcha} = req.body

    if (captcha !== req.session.captcha) {
        return res.status(400).json({message: 'Invalid captcha'})
    }

    try {
        const existingNameUser = await User.findOne({username})
        if (existingNameUser) {
            return res.status(400).json({message: 'An account under that username is already registered'})
        }
        const existingEmailUser = await User.findOne({email})
        if (existingEmailUser) {
            return res.status(400).json({message: 'An account under that email already registered'})
        }

        const user = new User({email, password, username})
        await user.save()

        const token = generateToken(user)
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        })

        res.json({message: 'Registration successful'})
    } catch (error) {
        res.status(500).json({message: 'Error registering user'})
    }
})

router.post('/api/auth/login', async (req, res) => {
    const { username, password, captcha } = req.body

    if (captcha !== req.session.captcha) {
        return res.status(400).json({ message: 'Invalid captcha' })
    }

    try {
        const user = await User.findOne({ username })
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' })
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' })
        }

        const token = generateToken(user)
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        })

        res.json({ message: 'Login successful' })
    } catch (error) {
        res.status(500).json({ message: 'Error logging in' })
    }
})

router.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token')
    return res.json({ message: 'Logged out successfully' })
})

router.get('/api/auth/test', authMiddleware, async (req, res) => {
    res.status(200).json({ message: 'You have access to this protected resource' })
})

router.get('/api/profile', authMiddleware, async (req, res) => {
    res.status(200).json({
        profilePic:req.user.profilePic,
        displayName:req.user.displayName,
        bio:req.user.bio,
    });
});

router.put('/api/profile/update', authMiddleware, async (req, res) => {
    const { displayName, email, password, newPassword, bio, action } = req.body;

    if(!action){
        return res.status(400).json({message: 'Action required'})
    }
    switch (action) {
        case 'generalInfo':
        try {
            if(!StringUtils.isEmptyOrNullOrUndefOrNanOrWhitespace(displayName))
                req.user.displayName = displayName;
            if(!StringUtils.isEmptyOrNullOrUndefOrNanOrWhitespace(email))
                req.user.email = email;
            if(!StringUtils.isEmptyOrNullOrUndefOrNanOrWhitespace(bio))
                req.user.bio = bio;
            req.user.save();
            return res.status(200).json({message: 'Updated successfully'})
        } catch (e) {
            console.log(e);
            return res.status(500).json({message: 'Error updating profile'})
        }
        case 'password':
            if(StringUtils.isEmptyOrNullOrUndefOrNanOrWhitespace(password))
                return res.status(400).json({message:"Password required"})
            if(StringUtils.isEmptyOrNullOrUndefOrNanOrWhitespace(newPassword))
                return res.status(400).json({message:"New Password required"})
            try {
                const user = await User.findOne({ userName:req.user.userName })
                if (!user) {
                    return res.status(401).json({ message: 'Invalid credentials' })
                }
                const isMatch = await bcrypt.compare(password, user.password)
                if (!isMatch) {
                    return res.status(401).json({ message: 'Invalid credentials' })
                }
                req.user.password = newPassword !== null ? newPassword : req.user.password;
                req.user.save();
                res.clearCookie('token')
                return res.status(200).json({message: 'Updated successfully, log in again'});
            } catch (e) {
                console.log(e)
                return res.status(500).json({message: 'Error updating password'})
            }
        default:
            return res.status(400).json({message:'Invalid action'});
    }
})

router.get('/api/profile/:id', authMiddleware, async (req, res) => {
    let id = req.params.id
    try {
        const user = await User.findById(id).select('displayName bio profilePic') // Exclude password username email field

        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        res.json(user)
    } catch (error) {
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid ID format' })
        }
        res.status(500).json({ message: 'Server error' })
    }
})

export default router;
