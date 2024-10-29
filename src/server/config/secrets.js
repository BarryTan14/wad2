import dotenv from 'dotenv'
import crypto from 'crypto'

dotenv.config()

const generateSecret = () => {
    return crypto.randomBytes(64).toString('hex')
}

const config = {
    jwt: {
        secret: process.env.JWT_SECRET || generateSecret(),
        options: {
            expiresIn: '24h',
            issuer: 'wad2',
            audience: 'wad2'
        }
    },
    session: {
        secret: process.env.SESSION_SECRET || generateSecret(),
        options: {
            name: 'sessionId',
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
                sameSite: 'strict'
            }
        }
    }
}

export default config