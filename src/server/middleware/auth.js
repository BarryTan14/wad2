import jwt from 'jsonwebtoken'
import { Users } from '../models/Users.js'
import dotenv from 'dotenv';
dotenv.config();

export const authMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies.token
        if (!token) {
            return res.status(401).json({ message: 'Authentication required' })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await Users.findOne({ username: decoded.username }).select('-password')

        if (!user) {
            return res.status(401).json({ message: 'User not found' })
        }

        req.user = user
        next()
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' })
    }
}