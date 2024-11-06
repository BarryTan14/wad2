import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import emailRouter from './routes/email.js';
import config from './config/index.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const mailgunApiKey = process.env.VITE_MAILGUN_API_KEY;
const mailgunDomain = process.env.VITE_MAILGUN_DOMAIN;

const app = express();

app.use(express.json());
app.use(express.static('public'));

// API routes
app.use('/api/email', emailRouter);

// Serve the frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.get('/api/config', (req, res) => {
  res.json({
    mailgunDomain: mailgunDomain
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
    });
});

app.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
});

export default app;