import mongoose from 'mongoose'
import {ObjectId} from "mongodb";

const ChatMessageSchema = new mongoose.Schema({
    saidBy: {
        type: ObjectId,
        ref: 'User',
    },
    saidTo: {
        type: ObjectId,
        ref: 'User',
    },
    saidIn: {
        type: ObjectId,
        ref: 'ChatRoom',
    },
    message: {
        type: String,
        required: true,
    },
    status : {
        type: String,
        default: 'active',
        enum: ['active', 'hidden', 'deleted'],
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
