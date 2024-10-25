import express from 'express';
import speech from '@google-cloud/speech';
import multer from 'multer';
import path from 'path'
import fs from 'fs'

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
    keyFilename: './src/server/key.json'
});

router.post('/upload', upload.single('audio'), async (req, res) => {
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

export default router;