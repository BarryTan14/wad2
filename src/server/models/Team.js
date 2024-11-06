import mongoose from 'mongoose'
import {ObjectId} from "mongodb";
import {randomUUID} from "crypto";

const TeamSchema = new mongoose.Schema({
    name: {
        type: String,
        default: randomUUID(),
        required: true,
    },
    description: {
        type: String,
        default: 'A New Team',
    },
    status : {
        type: String,
        default: 'active',
    },
    type : {
        type: String,
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

export const Team =  mongoose.model('team', TeamSchema)
