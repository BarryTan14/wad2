const express = require('express');
const path = require('path');
const { sendEmail } = require('./sendEmail');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Serve the frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Email sending endpoint
app.post('/send-email', async (req, res) => {
    try {
        const { to, subject, text, html } = req.body;

        // Basic validation
        if (!to || !subject || !text || !html) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields' 
            });
        }

        // Send email
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

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});