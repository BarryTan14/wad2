// // src/server/routes/calendar.js
// import express from 'express';
// import calendarService from '../services/calendarService.js';

// const router = express.Router();

// // Middleware to ensure calendar service is initialized
// const ensureCalendarInitialized = async (req, res, next) => {
//   try {
//     if (!calendarService.calendar) {
//       console.log('Initializing calendar service...');
//       const initialized = await calendarService.initialize();
//       if (!initialized) {
//         console.error('Calendar service initialization failed');
//         return res.status(500).json({ 
//           error: 'Calendar service initialization failed',
//           details: 'Please check service account configuration'
//         });
//       }
//       console.log('Calendar service initialized successfully');
//     }
//     next();
//   } catch (error) {
//     console.error('Calendar initialization error:', error);
//     res.status(500).json({
//       error: 'Calendar initialization failed',
//       details: error.message,
//       stack: error.stack
//     });
//   }
// };

// // Middleware to validate email
// const validateEmail = (req, res, next) => {
//   const { email } = req.query;
//   if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
//     return res.status(400).json({ error: 'Valid email is required' });
//   }
//   console.log('Email validated:', email);
//   next();
// };

// router.use(ensureCalendarInitialized);
// router.use(validateEmail);

// // List events
// router.get('/events', async (req, res) => {
//   try {
//     const { email } = req.query;
//     console.log('Checking calendar access for:', email);
    
//     const hasAccess = await calendarService.verifyAccess(email);
//     console.log('Calendar access check result:', hasAccess);
    
//     if (!hasAccess) {
//       console.log('Access denied for:', email);
//       console.log('Service account email:', calendarService.serviceAccount.client_email);
//       return res.status(403).json({
//         error: 'Calendar access denied',
//         details: `Please ensure you have shared your calendar with ${calendarService.serviceAccount.client_email} and granted "Make changes to events" permission`,
//         serviceAccount: calendarService.serviceAccount.client_email
//       });
//     }

//     console.log('Fetching events for:', email);
//     const events = await calendarService.listEvents(email);
//     console.log('Events fetched successfully');
//     res.json(events);
//   } catch (error) {
//     console.error('Error in /events route:', error);
//     res.status(500).json({ 
//       error: 'Failed to list events', 
//       details: error.message,
//       stack: error.stack
//     });
//   }
// });

// // Create event
// router.post('/events', async (req, res) => {
//   try {
//     const { email } = req.query;
//     const hasAccess = await calendarService.verifyAccess(email);
    
//     if (!hasAccess) {
//       return res.status(403).json({
//         error: 'Calendar access denied',
//         details: `Please grant ${calendarService.serviceAccount.client_email} access to the calendar`
//       });
//     }

//     const event = await calendarService.createEvent(email, req.body);
//     res.json(event);
//   } catch (error) {
//     res.status(500).json({ 
//       error: 'Failed to create event', 
//       details: error.message 
//     });
//   }
// });

// // Update event
// router.put('/events/:eventId', async (req, res) => {
//   try {
//     const { email } = req.query;
//     const { eventId } = req.params;
    
//     const hasAccess = await calendarService.verifyAccess(email);
//     if (!hasAccess) {
//       return res.status(403).json({
//         error: 'Calendar access denied',
//         details: `Please grant ${calendarService.serviceAccount.client_email} access to the calendar`
//       });
//     }

//     const event = await calendarService.updateEvent(email, eventId, req.body);
//     res.json(event);
//   } catch (error) {
//     res.status(500).json({ 
//       error: 'Failed to update event', 
//       details: error.message 
//     });
//   }
// });

// // Delete event
// router.delete('/events/:eventId', async (req, res) => {
//   try {
//     const { email } = req.query;
//     const { eventId } = req.params;
    
//     const hasAccess = await calendarService.verifyAccess(email);
//     if (!hasAccess) {
//       return res.status(403).json({
//         error: 'Calendar access denied',
//         details: `Please grant ${calendarService.serviceAccount.client_email} access to the calendar`
//       });
//     }

//     await calendarService.deleteEvent(email, eventId);
//     res.json({ message: 'Event deleted successfully' });
//   } catch (error) {
//     res.status(500).json({ 
//       error: 'Failed to delete event', 
//       details: error.message 
//     });
//   }
// });

// //test
// router.get('/test', async (req, res) => {
//   try {
//     if (!calendarService.calendar) {
//       await calendarService.initialize();
//     }
    
//     res.json({
//       status: 'OK',
//       serviceAccount: calendarService.serviceAccount.client_email,
//       initialized: !!calendarService.calendar
//     });
//   } catch (error) {
//     res.status(500).json({
//       error: 'Test failed',
//       details: error.message,
//       stack: error.stack
//     });
//   }
// });

// export default router;