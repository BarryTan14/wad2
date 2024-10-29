import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const usersSchema = new mongoose.Schema({
    profilepic : {
        type: String,
    },
    bio : {
        type: String,
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
    createdAt: {
        type: Date,
        default: Date.now
    },
    // Add any other user fields you need
}, { timestamps: true })

// Hash password before saving
usersSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next()
    this.password = await bcrypt.hash(this.password, 10)
    next()
})

export const Users = mongoose.model('Users', usersSchema)