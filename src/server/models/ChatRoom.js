import mongoose from 'mongoose'
import {ObjectId} from "mongodb";
import {randomUUID} from "crypto";

const ChatRoomSchema = new mongoose.Schema({
    name: {
        type: String,
        default: 'ChatRoom' + new Date().getTime().toString(),
        required: true,
    },
    description: {
        type: String,
        default: 'A New Chatroom',
    },
    status : {
        type: String,
        default: 'active',
        enum: ['active', 'inactive', 'locked', 'deleted'],
    },
    type : {
        type: String,
        default: 'user',
        enum: ['default', 'user', 'group'],
    },
    group : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
    },
    users : [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    moderatedBy : [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
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
