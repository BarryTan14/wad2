import { ObjectId } from 'mongodb'
import mongoose from 'mongoose'

const moduleSchema = new mongoose.Schema({
    // groupid : {
    //     type: String,
    // },
    // modulename : {
    //     type: String,
    // },
    _id: {
        type: ObjectId,
    },
    // Add any other user fields you need
}, { timestamps: true })

export const Module = mongoose.model('task', moduleSchema)