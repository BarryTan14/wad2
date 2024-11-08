import express from 'express';
import { CalendarEmailService } from '../services/calendarEmailService.js';

const router = express.Router();
const calendarEmailService = new CalendarEmailService();

// Middleware to ensure calendar service is initialized
const ensureCalendarInitialized = async (req, res, next) => {
    try {
      if (!calendarEmailService.isInitialized()) {
        await calendarEmailService.initialize();
      }
      next();
    } catch (error) {
      console.error('Calendar initialization error:', error);
      res.status(500).json({
        error: 'Calendar initialization failed',
        details: error.message
      });
    }
  };

// Middleware to validate email
const validateEmail = (req, res, next) => {
  const email = req.query.email || req.body.email;
  if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  next();
};

router.use(ensureCalendarInitialized);
router.use(validateEmail);

// List events
router.get('/events', async (req, res) => {
  try {
    const { email } = req.query;
    const events = await calendarEmailService.listEvents(email);
    res.json(events);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to list events', 
      details: error.message 
    });
  }
});

// Create event
router.post('/events', async (req, res) => {
    try {
      const { email } = req.query;
      const eventData = req.body;
      console.log('Creating event for:', email);
      console.log('Event data:', eventData);
      const event = await calendarEmailService.createEvent(email, eventData);
      console.log('Event created successfully:', event);
      res.json(event);
    } catch (error) {
      console.error('Error creating event:', error);
      res.status(500).json({ 
        error: 'Failed to create event', 
        details: error.message 
      });
    }
  });

// Update event
router.put('/events/:eventId', async (req, res) => {
  try {
    const { email } = req.query;
    const { eventId } = req.params;
    const event = await calendarEmailService.updateEvent(email, eventId, req.body);
    res.json(event);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to update event', 
      details: error.message 
    });
  }
});

// Delete event
router.delete('/events/:eventId', async (req, res) => {
  try {
    const { email } = req.query;
    const { eventId } = req.params;
    await calendarEmailService.deleteEvent(email, eventId);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to delete event', 
      details: error.message 
    });
  }
});

// Send email invitation
router.post('/send-invitation', async (req, res) => {
  try {
    const { to, subject, text, html, eventId } = req.body;
    
    // Validate required fields
    if (!to) {
      return res.status(400).json({ 
        success: false, 
        message: 'Recipients (to) is required',
        details: 'The "to" field must be provided' 
      });
    }
    
    // Convert to array if single email provided
    const recipients = Array.isArray(to) ? to : [to];
    
    if (recipients.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'At least one recipient is required',
        details: 'The "to" field must contain at least one email address' 
      });
    }
    
    if (!subject) {
      return res.status(400).json({ 
        success: false, 
        message: 'Subject is required',
        details: 'The "subject" field must be provided' 
      });
    }
    
    console.log('Sending invitation to multiple recipients:', {
      recipientCount: recipients.length,
      subject,
      eventId
    });
    
    const result = await calendarEmailService.sendEmailInvitation(
      recipients,
      subject,
      text,
      html,
      eventId
    );
    
    res.json({ 
      success: true, 
      message: `Email invitation sent successfully to ${recipients.length} recipients`, 
      result 
    });
  } catch (error) {
    console.error('Failed to send email invitation:', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send email invitation',
      details: error.message
    });
  }
});

// Add a test route for Mailgun
router.get('/test-mailgun', async (req, res) => {
  try {
    const result = await calendarEmailService.testEmailService();
    res.json({ success: true, message: 'Mailgun test successful', result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Mailgun test failed', error: error.message });
  }
});

export default router;