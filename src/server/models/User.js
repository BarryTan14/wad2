import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import {randomUUID} from "crypto";

// Function to generate a display name
function generateDisplayName() {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const timestamp = Date.now().toString().slice(-4);
    return `User${randomNum}${timestamp}`;
}

const userSchema = new mongoose.Schema({
    profilePic : {
        type: String,
        default: 'avatar.png',
    },
    displayName : {
        type: String,
        required: true,
        unique: true,
        default: generateDisplayName
    },
    role : {
        type: String,
        required: true,
        default: 'User',
        enum: ['User', 'Student', 'Professor', 'Mod', 'Admin'],
    },
    bio : {
        type: String,
        default: 'Hello There',
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
    },
    joinedChatrooms: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatRoom'
    }],
    joinedGroups: [{
        groupId: { type: String, required: true },
        moduleTitle: { type: String, required: true }
    }],

    associatedTranscriptions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transcription'
    }],
    accountStatus: {
        type: String,
        required: true,
        default: 'active',
        enum: ['active', 'inactive', 'banned', 'locked', 'deleted'],
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
}, { timestamps: true })

// Add an index to ensure uniqueness and handle retries
userSchema.index({ displayName: 1 }, {
    unique: true,
    // If there's a duplicate, MongoDB will retry the operation
    background: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();

    try {
        this.password = await bcrypt.hash(this.password, 10);
        next();
    } catch (error) {
        next(error);
    }
});

// Add a pre-validate middleware to handle duplicate displayName
userSchema.pre('validate', async function(next) {
    if (this.isNew) {
        let attempts = 0;
        const maxAttempts = 5;

        while (attempts < maxAttempts) {
            try {
                // Check if the current displayName exists
                const existingUser = await mongoose.model('User').findOne({ displayName: this.displayName });
                if (!existingUser) {
                    break; // If no duplicate found, proceed
                }

                // If duplicate found, generate a new displayName
                this.displayName = generateDisplayName();
                attempts++;
            } catch (error) {
                next(error);
                return;
            }
        }

        // If all attempts fail, use UUID as fallback
        if (attempts === maxAttempts) {
            this.displayName = `User${randomUUID().slice(0, 8)}`;
        }
    }
    next();
});

export const User = mongoose.model('User', userSchema)