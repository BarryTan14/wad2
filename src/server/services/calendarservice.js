// // src/server/services/calendarService.js
// import { google } from 'googleapis';
// import { fileURLToPath } from 'url';
// import { dirname, join } from 'path';
// import fs from 'fs/promises';
// import throttledQueue from 'throttled-queue';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// console.log("This page runs");

// class CalendarService {
//   constructor() {
//     this.calendar = null;
//     this.serviceAccount = null;
    
//     // Create throttled queues for different operations
//     // Google Calendar API quotas:
//     // - Queries per second per user: 10
//     // - Queries per day per user: 1,000,000
//     this.readThrottle = throttledQueue(10, 1000); // 10 requests per second
//     this.writeThrottle = throttledQueue(5, 1000);  // 5 write operations per second
//   }

//   async initialize() {
//     try {
//       console.log('Starting calendar service initialization...');
      
//       const keyPath = join(__dirname, '..', '..', 'key.json');
//       console.log('Looking for key.json at:', keyPath);
      
//       try {
//         await fs.access(keyPath);
//         console.log('key.json file found');
//       } catch (error) {
//         console.error('key.json not found at:', keyPath);
//         throw new Error(`key.json not found at ${keyPath}`);
//       }

//       const keyContent = await fs.readFile(keyPath, 'utf8');
//       console.log('key.json file read successfully');
      
//       try {
//         this.serviceAccount = JSON.parse(keyContent);
//         console.log('Service account email:', this.serviceAccount.client_email);
//       } catch (error) {
//         console.error('Error parsing key.json:', error);
//         throw new Error('Invalid key.json format');
//       }

//       if (!this.serviceAccount.client_email || !this.serviceAccount.private_key) {
//         console.error('Missing required fields in key.json');
//         throw new Error('Invalid service account key: missing required fields');
//       }

//       console.log('Creating JWT client...');
//       const jwtClient = new google.auth.JWT(
//         this.serviceAccount.client_email,
//         null,
//         this.serviceAccount.private_key,
//         ['https://www.googleapis.com/auth/calendar']
//       );

//       console.log('Testing authentication...');
//       try {
//         await jwtClient.authorize();
//         console.log('Authentication successful');
//       } catch (error) {
//         console.error('Authentication failed:', error);
//         throw new Error(`Authentication failed: ${error.message}`);
//       }

//       this.calendar = google.calendar({ 
//         version: 'v3', 
//         auth: jwtClient
//       });

//       console.log('Calendar service initialization complete');
//       return true;
//     } catch (error) {
//       console.error('Calendar service initialization failed:', error);
//       throw error;
//     }
//   }

//   async verifyAccess(calendarId) {
//     return this.readThrottle(async () => {
//       try {
//         console.log('Verifying calendar access for:', calendarId);
//         const response = await this.calendar.calendars.get({ calendarId });
//         console.log('Calendar access verified successfully');
//         return true;
//       } catch (error) {
//         console.error('Calendar access verification failed:', error.message);
//         if (error.code === 404) {
//           console.log('Calendar not found or no access');
//         } else if (error.code === 403) {
//           console.log('Permission denied');
//         }
//         return false;
//       }
//     });
//   }

//   async listEvents(calendarId) {
//     return this.readThrottle(async () => {
//       console.log('Listing events for calendar:', calendarId);
//       try {
//         const response = await this.calendar.events.list({
//           calendarId,
//           timeMin: new Date().toISOString(),
//           maxResults: 10,
//           singleEvents: true,
//           orderBy: 'startTime'
//         });
//         console.log(`Found ${response.data.items?.length || 0} events`);
//         return response.data.items || [];
//       } catch (error) {
//         console.error('Error listing events:', error);
//         throw error;
//       }
//     });
//   }

//   async createEvent(calendarId, eventData) {
//     return this.writeThrottle(async () => {
//       try {
//         const response = await this.calendar.events.insert({
//           calendarId,
//           requestBody: eventData,
//         });
//         return response.data;
//       } catch (error) {
//         throw new Error(`Failed to create event: ${error.message}`);
//       }
//     });
//   }

//   async updateEvent(calendarId, eventId, eventData) {
//     return this.writeThrottle(async () => {
//       try {
//         const response = await this.calendar.events.update({
//           calendarId,
//           eventId,
//           requestBody: eventData,
//         });
//         return response.data;
//       } catch (error) {
//         throw new Error(`Failed to update event: ${error.message}`);
//       }
//     });
//   }

//   async deleteEvent(calendarId, eventId) {
//     return this.writeThrottle(async () => {
//       try {
//         await this.calendar.events.delete({
//           calendarId,
//           eventId,
//         });
//         return true;
//       } catch (error) {
//         throw new Error(`Failed to delete event: ${error.message}`);
//       }
//     });
//   }
// }

// export default new CalendarService();