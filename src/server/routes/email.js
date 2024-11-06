import express from 'express';
import { sendEmail } from '../services/emailservice.js';
import { validateEmail } from '../middleware/validation.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(rateLimiter);

router.post('/send', validateEmail, async (req, res) => {
    try {
        const { to, subject, text, html } = req.body;
        console.log('Received email request:', { to, subject, text, html });
        const result = await sendEmail(to, subject, text, html);
        
        res.json({ 
            success: true, 
            message: 'Email sent successfully', 
            result 
        });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to send email',
            details: error.details || {} 
        });
    }
});

export default router;