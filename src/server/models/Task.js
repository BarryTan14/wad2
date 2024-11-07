import mongoose from 'mongoose'

const taskSchema = new mongoose.Schema({
    taskId: { type: String, required: true },
    taskName: { type: String, required: true },
    deadline: { type: String, required: true },
    membersInCharge: { type: Array, required: true },
    status: { type: Boolean, required: false },
    isEditing: {type: Boolean, required:false},
}, { timestamps: true })

export const Task = mongoose.model('tasks', taskSchema)