import express from 'express';
import speech from '@google-cloud/speech';
import multer from 'multer';
import path from 'path'
import fs from 'fs'
import {User} from "../models/User.js";
import {Group} from "../models/Group.js"
import {Transcription} from "../models/Transcription.js";
import {authMiddleware} from "../middleware/auth.js";
import mongoose from "mongoose";

const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Ensure uploads directory exists
if (!fs.existsSync('uploads')){
    fs.mkdirSync('uploads');
}

// Initialize Google Cloud Speech client
const client = new speech.SpeechClient({
    keyFilename: './src/key.json'
});

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

router.get('/transcriptions', authMiddleware, asyncHandler(async (req, res) => {
    try {
        // Find the authenticated user
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Build query
        const query = {
            saidBy: user._id,
        };

        // Get transcriptions with populated user and module data
        const transcriptions = await Transcription.find(query)
            .sort({ createdAt: -1 }) // Sort by newest first
            .populate({
                path: 'saidBy',
                select: '-password -associatedTranscriptions' // Exclude sensitive and recursive data
            })
            .populate({
                path: 'saidFor',
                select: 'groupId groupName moduleName' // Select specific module fields
            });

        // Return response
        res.json({
            transcriptions,
        });
    } catch (error) {
        console.error('Error fetching transcriptions:', error);
        res.status(500).json({
            message: 'Error fetching transcriptions',
            error: error.message
        });
    }
}));

router.delete('/transcriptions/:transcriptionId', authMiddleware, asyncHandler(async (req, res) => {
    const { transcriptionId } = req.params;
    const user = await User.findById(req.user._id).select("-password");

    // Find the transcription
    const transcription = await Transcription.findById(transcriptionId);
    if (!transcription) {
        return res.status(404).json({ message: 'No transcription found.' });
    }

    // Verify ownership
    if (transcription.saidBy.toString() !== user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to delete this transcription.' });
    }

    // Remove transcription reference from user
    await User.findByIdAndUpdate(user._id, {
        $pull: { associatedTranscriptions: transcriptionId }
    });

    // Delete the transcription
    await Transcription.findByIdAndDelete(transcriptionId);

    res.json({ message: 'Transcription deleted successfully' });
}));

router.post('/transcriptions/:transcriptionId', authMiddleware, asyncHandler(async (req, res) => {
    const transcriptionId = req.params.transcriptionId;
    const { moduleId, content } = req.body;
    const user = await User.findById(req.user._id).select("-password");

    // Find the transcription
    const transcription = await Transcription.findById(transcriptionId);
    if (!transcription) {
        return res.status(404).json({ message: 'No transcription found.' });
    }

    // Verify ownership
    if (transcription.saidBy.toString() !== user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to update this transcription.' });
    }

    const module = await Group.findById(moduleId);
    if (!module) {
        return res.status(404).json({ message: 'No group found.' });
    }

    try {
        // Update transcription
        transcription.content = content;
        transcription.saidFor = module._id;

        // Save the transcription
        await transcription.save();
    } catch (e) {
        console.log(e)
        return res.status(500).json({message: 'Internal Server Error: ' + e.message})
    }

    res.status(200).json({ message: 'Transcription saved successfully' });
}));

router.post('/upload', authMiddleware, upload.single('audio'), async (req, res) => {
    try {
        console.log('Request received:', {
            file: req.file,
            body: req.body
        });

        // Check if file exists
        if (!req.file) {
            console.error('No file received');
            return res.status(400).json({ error: 'No audio file uploaded' });
        }

        // Read the file from disk
        const audioBytes = fs.readFileSync(req.file.path);
        console.log('File read, size:', audioBytes.length);

        const audio = {
            content: audioBytes.toString('base64')
        };

        console.log('Audio content created');

        const config = {
            encoding: 'WEBM_OPUS',
            languageCode: 'en-US',
        };

        console.log('Sending request to Google Cloud');

        const request = {
            audio: audio,
            config: config,
        };

        const [response] = await client.recognize(request);
        const transcription = response.results
            .map(result => result.alternatives[0].transcript)
            .join('\n');

        console.log('Transcription received:', transcription);

        if(transcription)
            await handleTranscription(req, res, transcription);

        // Clean up: delete the file after processing
        fs.unlinkSync(req.file.path);

        res.json({ transcription });
    } catch (error) {
        console.error('Detailed error:', error);
        res.status(500).json({
            error: 'Transcription failed',
            details: error.message,
            stack: error.stack
        });
    }
});

async function handleTranscription(req, res, transcription) {
    const user = await User.findById(req.user._id).select('-password');
    const transcribe = new Transcription({
        saidBy: user._id,
        saidFor: req.body.moduleId,
        content: transcription
    });

    console.log(transcribe)

    try {
        await transcribe.save();
    } catch (e) {
        console.error(e);
        return res.status(500).json({message: e.message});
    }

    user.associatedTranscriptions.push(transcribe.id);

    try {
        await user.save();
    } catch (e) {
        console.error(e);
        return res.status(500).json({message: e.message});
    }
}

export default router;