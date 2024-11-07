import { ObjectId } from 'mongodb'
import mongoose from 'mongoose'

const moduleSchema = new mongoose.Schema({
    groupId: { type: String, required: true },
    groupName: { type: String, required: true },
    moduleName: { type: String, required: true },
    teamMembers: { type: Array, required: true },
    taskList: { type: Array, required: false },
    // chatRoom: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'ChatRoom'
    // }
}, { timestamps: true })

export const Module = mongoose.model('groups', moduleSchema)