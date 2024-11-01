import mongoose from 'mongoose'
import {ObjectId} from "mongodb";
import {randomUUID} from "crypto";

const ChatRoomSchema = new mongoose.Schema({
    name: {
        type: String,
        default: randomUUID(),
        required: true,
    },
    description: {
        type: String,
        default: 'A New Chatroom',
    },
    status : {
        type: String,
        default: 'active',
    },
    users : {
        type: Array,
    },
    createdBy: {
        type: ObjectId,
    },
    moderatedBy : {
        type: Array,
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

export const ChatRoom =  mongoose.model('chatRoom', ChatRoomSchema)
