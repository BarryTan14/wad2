import mongoose from 'mongoose'

const moduleSchema = new mongoose.Schema({
    groupid : {
        type: String,
    },
    modulename : {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    // Add any other user fields you need
}, { timestamps: true })

export const Module = mongoose.model('Module', moduleSchema)