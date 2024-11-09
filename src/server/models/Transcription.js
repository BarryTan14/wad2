import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import {randomUUID} from "crypto";

const transcriptionSchema = new mongoose.Schema({
    saidBy : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    saidFor : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'groups'
    },
    content : {
        type: String,
    },
    status : {
        type: String,
        default: 'active',
        enum: ['active', 'deleted'],
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    // Add any other user fields you need
}, { timestamps: true })

export const Transcription = mongoose.model('Transcription', transcriptionSchema)