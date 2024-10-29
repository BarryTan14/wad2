// index.js
const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const path = require('path');
const cors = require('cors');
const session = require('express-session');

const { GoogleAuth } = require('google-auth-library');

// Initialize express app
const app = express();

// Replace these with your own values
const CLIENT_SECRETS_FILE = "path/to/client_secret.json";
const SCOPES = ['https://www.googleapis.com/auth/calendar.settings.readonly'];
const API_SERVICE_NAME = 'calendar';
const API_VERSION = 'v3';

// Service account credentials
const serviceAccount = require('./key.json');

// Create a JWT client using service account
const jwtClient = new google.auth.JWT(
  serviceAccount.client_email,
  null,
  serviceAccount.private_key,
  ['https://www.googleapis.com/auth/calendar'],
  null
);

async function authorizeServiceAccount(req, res) {
  try {
    const auth = new GoogleAuth({
      credentials: require(serviceAccount),
      scopes: SCOPES,
    });

    const calendar = google.calendar({ version: API_VERSION, auth });
    res.json({ message: 'Service account authorized successfully!' });
  } catch (err) {
    console.error('Error authorizing service account:', err);
    res.status(500).json({ error: 'Error authorizing service account' });
  }
}

app.get('/authorize-service-account', authorizeServiceAccount);

// Helper function to verify calendar access
async function verifyCalendarAccess(calendarId, auth) {
  const calendar = google.calendar({ version: 'v3', auth });
  try {
    // Try to get calendar metadata to verify access
    await calendar.calendars.get({
      calendarId: calendarId
    });
    return true;
  } catch (error) {
    console.error('Calendar access verification failed:', error);
    return false;
  }
}

// Middleware setup
app.use(cors({ 
  credentials: true, 
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.static(path.join(__dirname)));
app.use(bodyParser.json());
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Middleware to validate user email
const validateUser = async (req, res, next) => {
  const userEmail = req.session.userEmail;
  if (!userEmail) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  next();
};

// Login endpoint
app.post('/login', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Store user email in session
    req.session.userEmail = email;
    res.json({ message: 'Login successful', email });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
app.get('/current-user', validateUser, (req, res) => {
  res.json({ email: req.session.userEmail });
});

// Logout endpoint
app.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out successfully' });
});

// List events endpoint
app.get('/events', validateUser, async (req, res) => {
  try {
    await jwtClient.authorize();
    
    // Verify calendar access first
    const hasAccess = await verifyCalendarAccess(req.session.userEmail, jwtClient);
    if (!hasAccess) {
      return res.status(403).json({ 
        error: 'Calendar access denied',
        details: `Please share your calendar with ${serviceAccount.client_email} and grant "Make changes and manage sharing" permission.`,
        setupInstructions: [
          '1. Go to Google Calendar (calendar.google.com)',
          '2. Find your calendar in the left sidebar',
          '3. Click the three dots next to your calendar and select "Settings and sharing"',
          '4. Scroll down to "Share with specific people"',
          '5. Click "+ Add people"',
          `6. Add the service account email: ${serviceAccount.client_email}`,
          '7. Set the permission to "Make changes and manage sharing"',
          '8. Click "Send"'
        ]
      });
    }

    const calendar = google.calendar({ version: 'v3', auth: jwtClient });
    
    const response = await calendar.events.list({
      calendarId: req.session.userEmail,
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });
    res.json(response.data.items || []);
  } catch (error) {
    console.error('Error listing events:', error);
    if (error.code === 404) {
      res.status(404).json({ 
        error: 'Calendar not found',
        details: 'Make sure the email address has a Google Calendar.'
      });
    } else if (error.code === 403) {
      res.status(403).json({ 
        error: 'Permission denied',
        details: `Please ensure that ${serviceAccount.client_email} has been granted access to your calendar with "Make changes and manage sharing" permission.`,
        setupInstructions: [
          '1. Go to Google Calendar (calendar.google.com)',
          '2. Find your calendar in the left sidebar',
          '3. Click the three dots next to your calendar and select "Settings and sharing"',
          '4. Scroll down to "Share with specific people"',
          '5. Click "+ Add people"',
          `6. Add the service account email: ${serviceAccount.client_email}`,
          '7. Set the permission to "Make changes and manage sharing"',
          '8. Click "Send"'
        ]
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to list events', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
});

// Create event endpoint
app.post('/events', validateUser, async (req, res) => {
  try {
    await jwtClient.authorize();
    
    // Verify calendar access first
    const hasAccess = await verifyCalendarAccess(req.session.userEmail, jwtClient);
    if (!hasAccess) {
      return res.status(403).json({ 
        error: 'Calendar access denied',
        details: `Please share your calendar with ${serviceAccount.client_email} and grant "Make changes and manage sharing" permission.`,
        setupInstructions: [
          '1. Go to Google Calendar (calendar.google.com)',
          '2. Find your calendar in the left sidebar',
          '3. Click the three dots next to your calendar and select "Settings and sharing"',
          '4. Scroll down to "Share with specific people"',
          '5. Click "+ Add people"',
          `6. Add the service account email: ${serviceAccount.client_email}`,
          '7. Set the permission to "Make changes and manage sharing"',
          '8. Click "Send"'
        ]
      });
    }

    const calendar = google.calendar({ version: 'v3', auth: jwtClient });
    
    // Format the event data
    const eventData = {
      summary: req.body.summary,
      location: req.body.location,
      description: req.body.description,
      start: {
        dateTime: req.body.start.dateTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone // Use local timezone
      },
      end: {
        dateTime: req.body.end.dateTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone // Use local timezone
      },
      attendees: req.body.attendees || [],
      guestsCanSeeOtherGuests: true,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 }
        ]
      },
      sendUpdates: 'all'
    };

    // Insert the event
    const response = await calendar.events.insert({
      auth: jwtClient,
      calendarId: req.session.userEmail,
      requestBody: eventData,
      sendNotifications: true,
      supportsAttachments: true
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error creating event:', error);
    
    // Enhanced error handling
    if (error.code === 404) {
      res.status(404).json({ 
        error: 'Calendar not found',
        details: 'Make sure the email address has a Google Calendar.'
      });
    } else if (error.code === 403) {
      res.status(403).json({ 
        error: 'Permission denied',
        details: `Please ensure that ${serviceAccount.client_email} has been granted access to your calendar with "Make changes and manage sharing" permission.`,
        setupInstructions: [
          '1. Go to Google Calendar (calendar.google.com)',
          '2. Find your calendar in the left sidebar',
          '3. Click the three dots next to your calendar and select "Settings and sharing"',
          '4. Scroll down to "Share with specific people"',
          '5. Click "+ Add people"',
          `6. Add the service account email: ${serviceAccount.client_email}`,
          '7. Set the permission to "Make changes and manage sharing"',
          '8. Click "Send"'
        ]
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to create event', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
});

// Update event endpoint with calendar verification
app.put('/events/:eventId', validateUser, async (req, res) => {
  try {
    await jwtClient.authorize();
    
    // Verify calendar access first
    const hasAccess = await verifyCalendarAccess(req.session.userEmail, jwtClient);
    if (!hasAccess) {
      return res.status(403).json({ 
        error: 'Calendar access denied',
        details: `Please share your calendar with ${serviceAccount.client_email} and grant "Make changes and manage sharing" permission.`,
        setupInstructions: [
          '1. Go to Google Calendar (calendar.google.com)',
          '2. Find your calendar in the left sidebar',
          '3. Click the three dots next to your calendar and select "Settings and sharing"',
          '4. Scroll down to "Share with specific people"',
          '5. Click "+ Add people"',
          `6. Add the service account email: ${serviceAccount.client_email}`,
          '7. Set the permission to "Make changes and manage sharing"',
          '8. Click "Send"'
        ]
      });
    }

    const calendar = google.calendar({ version: 'v3', auth: jwtClient });
    
    const eventData = {
      summary: req.body.summary,
      location: req.body.location,
      description: req.body.description,
      start: {
        dateTime: req.body.start.dateTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: req.body.end.dateTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      attendees: req.body.attendees || [],
      guestsCanSeeOtherGuests: true,
      sendUpdates: 'all'
    };

    const response = await calendar.events.update({
      auth: jwtClient,
      calendarId: req.session.userEmail,
      eventId: req.params.eventId,
      requestBody: eventData,
      sendNotifications: true
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error updating event:', error);
    // Use the same enhanced error handling as create event
    if (error.code === 404) {
      res.status(404).json({ 
        error: 'Calendar not found',
        details: 'Make sure the email address has a Google Calendar.'
      });
    } else if (error.code === 403) {
      res.status(403).json({ 
        error: 'Permission denied',
        details: `Please ensure that ${serviceAccount.client_email} has been granted access to your calendar with "Make changes and manage sharing" permission.`,
        setupInstructions: [
          '1. Go to Google Calendar (calendar.google.com)',
          '2. Find your calendar in the left sidebar',
          '3. Click the three dots next to your calendar and select "Settings and sharing"',
          '4. Scroll down to "Share with specific people"',
          '5. Click "+ Add people"',
          `6. Add the service account email: ${serviceAccount.client_email}`,
          '7. Set the permission to "Make changes and manage sharing"',
          '8. Click "Send"'
        ]
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to update event', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
});

// Delete event endpoint with calendar verification
app.delete('/events/:eventId', validateUser, async (req, res) => {
  try {
    await jwtClient.authorize();
    
    // Verify calendar access first
    const hasAccess = await verifyCalendarAccess(req.session.userEmail, jwtClient);
    if (!hasAccess) {
      return res.status(403).json({ 
        error: 'Calendar access denied',
        details: `Please share your calendar with ${serviceAccount.client_email} and grant "Make changes and manage sharing" permission.`,
        setupInstructions: [
          '1. Go to Google Calendar (calendar.google.com)',
          '2. Find your calendar in the left sidebar',
          '3. Click the three dots next to your calendar and select "Settings and sharing"',
          '4. Scroll down to "Share with specific people"',
          '5. Click "+ Add people"',
          `6. Add the service account email: ${serviceAccount.client_email}`,
          '7. Set the permission to "Make changes and manage sharing"',
          '8. Click "Send"'
        ]
      });
    }

    const calendar = google.calendar({ version: 'v3', auth: jwtClient });
    
    await calendar.events.delete({
      auth: jwtClient,
      calendarId: req.session.userEmail,
      eventId: req.params.eventId,
      sendNotifications: true
    });
    
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    // Use the same enhanced error handling
    if (error.code === 404) {
      res.status(404).json({ 
        error: 'Calendar not found',
        details: 'Make sure the email address has a Google Calendar.'
      });
    } else if (error.code === 403) {
      res.status(403).json({ 
        error: 'Permission denied',
        details: `Please ensure that ${serviceAccount.client_email} has been granted access to your calendar with "Make changes and manage sharing" permission.`,
        setupInstructions: [
          '1. Go to Google Calendar (calendar.google.com)',
          '2. Find your calendar in the left sidebar',
          '3. Click the three dots next to your calendar and select "Settings and sharing"',
          '4. Scroll down to "Share with specific people"',
          '5. Click "+ Add people"',
          `6. Add the service account email: ${serviceAccount.client_email}`,
          '7. Set the permission to "Make changes and manage sharing"',
          '8. Click "Send"'
        ]
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to delete event', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));