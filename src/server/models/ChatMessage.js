import mongoose from 'mongoose'
import {ObjectId} from "mongodb";

const ChatMessageSchema = new mongoose.Schema({
    saidBy: {
        type: ObjectId,
    },
    displayName: String,
    saidTo: {
        type: ObjectId,
    },
    saidIn: {
        type: String,
    },
    message: {
        type: String,
    },
    status : {
        type: String,
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
}, {timestamps: true})

export const ChatMessage =  mongoose.model('chatMessage', ChatMessageSchema)
