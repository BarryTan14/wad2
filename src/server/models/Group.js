import { ObjectId } from 'mongodb'
import mongoose from 'mongoose'

const groupSchema = new mongoose.Schema({
    groupId: { type: String, required: true },
    moduleName: { type: String, required: true },
    teamMembers: { type: Array, required: true },
}, { timestamps: true })

export const Group = mongoose.model('groups', groupSchema)