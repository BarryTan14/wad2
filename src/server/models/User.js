import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import {randomUUID} from "crypto";

const userSchema = new mongoose.Schema({
    profilePic : {
        type: String,
        default: 'avatar.png',
    },
    displayName : {
        type: String,
        required: true,
        default: randomUUID(),
    },
    role : {
        type: String,
        required: true,
        default: 'user',
    },
    bio : {
        type: String,
        default: '',
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
    },
    accountStatus: {
        type: String,
        required: true,
        default: 'active',
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    // Add any other user fields you need
}, { timestamps: true })

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next()
    this.password = await bcrypt.hash(this.password, 10)
    next()
})

export const User = mongoose.model('User', userSchema)