import express from 'express';
import db from "../db/conn.js";
import bcrypt from "bcrypt";
import {Users} from "../models/Users.js";
import jwt from "jsonwebtoken";
import config from '../config/secrets.js'
import {authMiddleware} from "../middleware/auth.js";

const router = express.Router();

const generateToken = (user) => {
    return jwt.sign(
        {userId: user._id, username: user.username},
        config.jwt.secret,
        config.jwt.options
    )
}

router.post('/api/auth/register', async (req, res) => {
    const {email, password, username, captcha} = req.body

    if (captcha !== req.session.captcha) {
        return res.status(400).json({message: 'Invalid captcha'})
    }

    try {
        const existingNameUser = await Users.findOne({username})
        if (existingNameUser) {
            return res.status(400).json({message: 'An account under that username is already registered'})
        }
        const existingEmailUser = await Users.findOne({email})
        if (existingEmailUser) {
            return res.status(400).json({message: 'An account under that email already registered'})
        }

        const users = new Users({email, password, username})
        await users.save()

        const token = generateToken(users)
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
        const users = await Users.findOne({ username })
        if (!users) {
            return res.status(401).json({ message: 'Invalid credentials' })
        }

        const isMatch = await bcrypt.compare(password, users.password)
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' })
        }

        const token = generateToken(users)
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

router.get('/api/profile', authMiddleware, async (req, res) => {
    res.json({ message: 'You have access to this protected resource' })
})

router.post("/login", async (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    if (!username || !password) {
        res.status(400).send("There are empty fields");
        return;
    }
    try {
        let collection = await db.collection("users");
        let result = await collection.findOne({username: username});
        if (!result) {
            res.status(200).send("No user found");
            return;
        }
        bcrypt.compare(password, result.password).then(result => {
            if (result)
                res.status(200).send("logged in")
            else
                res.status(200).send("wrong login details");
        });
    } catch (e) {
        res.status(500).send(e.message);
        return
    }
});

router.post("/register", async (req, res) => {
    let email = req.body.email;
    let username = req.body.username;
    let password = req.body.password;
    if (!username || !password || !email) {
        res.send("There are empty fields");
        return;
    }

    // TODO: check if user exists first before attempting push
    try {
        let collection = await db.collection("users");
        let result = await collection.findOne({username: username});
        if (!result) {
            res.status(200).send("No user found");
            return;
        }
        bcrypt.compare(password, result.password).then(result => {
            if (result)
                res.send("logged in")
            else
                res.send("wrong login details");
        });
    } catch (e) {
        res.send(e.message);
        return
    }

    // use salt to encrypt password
    // unused in favour of bcrypt
    //let salt = cryptoRandomString({length: 10, type:'ascii-printable'});

    //password = password + salt;
    bcrypt.hash(password, 10).then(async hash => {
        try {
            let collection = await db.collection("users");
            let dataToPush = {
                email: email,
                username: username,
                password: hash,
            }
            let result = await collection.insertOne(dataToPush);

            res.status(201).send("Registered successfully");
            return
        } catch (e) {
            if (e.code === 11000) {
                res.status(409).send("An account under that email already exists");
                return
            }
            res.status(500).send(e.message);
            return
        }
    })
});

export default router;
