import { ObjectId } from 'mongodb'
import mongoose from 'mongoose'

const moduleSchema = new mongoose.Schema({
    module_name: { type: String, required: true },
    module_id: { type: String, required: true },
    description: { type: String, required: true },
    groupId: { type: String, required: true },
    chatRoom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatRoom'
    }
}, { timestamps: true })

export const Module = mongoose.model('task', moduleSchema)