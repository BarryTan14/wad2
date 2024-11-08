import { google } from 'googleapis';
import formData from 'form-data';
import Mailgun from 'mailgun.js';
import config from '../config/index.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import throttledQueue from 'throttled-queue';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class CalendarEmailService {
  constructor() {
    this.calendar = null;
    this.serviceAccount = null;
    this.readThrottle = throttledQueue(10, 1000);
    this.writeThrottle = throttledQueue(5, 1000);
    this.mailgun = new Mailgun(formData);
    this.mg = this.mailgun.client({
      username: 'api',
      key: config.mailgun.apiKey
    });
  }

  async initialize() {
    try {
      const keyPath = join(__dirname, '..', '..', 'key.json');
      const keyContent = await fs.readFile(keyPath, 'utf8');
      this.serviceAccount = JSON.parse(keyContent);

      const jwtClient = new google.auth.JWT(
        this.serviceAccount.client_email,
        null,
        this.serviceAccount.private_key,
        ['https://www.googleapis.com/auth/calendar']
      );

      await jwtClient.authorize();

      this.calendar = google.calendar({ 
        version: 'v3', 
        auth: jwtClient
      });

      return true;
    } catch (error) {
      console.error('Calendar service initialization failed:', error);
      throw error;
    }
  }

  isInitialized() {
    return !!this.calendar;
  }

  async verifyAccess(calendarId) {
    return this.readThrottle(async () => {
      try {
        await this.calendar.calendars.get({ calendarId });
        return true;
      } catch (error) {
        if (error.code === 404 || error.code === 403) {
          return false;
        }
        throw error;
      }
    });
  }

  async listEvents(calendarId) {
    return this.readThrottle(async () => {
      const response = await this.calendar.events.list({
        calendarId,
        timeMin: new Date().toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime'
      });
      return response.data.items || [];
    });
  }

  async createEvent(calendarId, eventData) {
    return this.writeThrottle(async () => {
      try {
        console.log('Creating event for calendar:', calendarId);
        console.log('Event data:', eventData);
        const response = await this.calendar.events.insert({
          calendarId,
          requestBody: {
            summary: eventData.summary,
            description: eventData.description,
            start: eventData.start,
            end: eventData.end
          },
        });
        console.log('Event created successfully:', response.data);
        return response.data;
      } catch (error) {
        console.error('Error in createEvent:', error);
        throw new Error(`Failed to create event: ${error.message}`);
      }
    });
  }

  async updateEvent(calendarId, eventId, eventData) {
    return this.writeThrottle(async () => {
      const response = await this.calendar.events.update({
        calendarId,
        eventId,
        requestBody: eventData,
      });
      return response.data;
    });
  }

  async deleteEvent(calendarId, eventId) {
    return this.writeThrottle(async () => {
      await this.calendar.events.delete({
        calendarId,
        eventId,
      });
      return true;
    });
  }

  async sendEmailInvitation(recipients, subject, text, html, eventId) {
    try {
      // Convert single recipient to array if necessary
      const recipientList = Array.isArray(recipients) ? recipients : [recipients];
      
      // Validate all email addresses
      const invalidEmails = recipientList.filter(email => !this.isValidEmail(email));
      if (invalidEmails.length > 0) {
        throw new Error(`Invalid email addresses: ${invalidEmails.join(', ')}`);
      }

      console.log('Sending email invitation:', { recipients: recipientList, subject, eventId });
      
      const msg = await this.mg.messages.create(config.mailgun.domain, {
        from: `Event Invitation <mailgun@${config.mailgun.domain}>`,
        to: recipientList,
        subject: subject,
        text: text,
        html: html
      });
    
      console.log('Email sent successfully:', msg.id);
      
      // If eventId is provided, add all recipients as attendees
      if (eventId) {
        await Promise.all(recipientList.map(email => 
          this.addAttendeeToEvent(this.calendarId, eventId, email)
        ));
      }

      return {
        id: msg.id,
        status: msg.status,
        message: 'Email invitation sent successfully',
        recipients: recipientList
      };
    } catch (error) {
      console.error('Failed to send email invitation:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
    // Add email validation helper method
    isValidEmail(email) {
      return email && email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    }
  

  // Optional: Add the invited email to the event attendees
  // Update addAttendeeToEvent to handle duplicate checks
  async addAttendeeToEvent(calendarId, eventId, email) {
    return this.writeThrottle(async () => {
      const event = await this.calendar.events.get({
        calendarId,
        eventId,
      });

      // Check if attendee already exists
      const existingAttendees = event.data.attendees || [];
      if (!existingAttendees.some(attendee => attendee.email === email)) {
        const updatedEvent = {
          ...event.data,
          attendees: [...existingAttendees, { email }],
        };

        await this.calendar.events.update({
          calendarId,
          eventId,
          requestBody: updatedEvent,
        });
      }
    });
  }

  async testEmailService() {
    try {
      const testResult = await this.mg.messages.create(config.mailgun.domain, {
        from: `Test <mailgun@${config.mailgun.domain}>`,
        to: ['test@example.com'],
        subject: 'Mailgun Test',
        text: 'This is a test email from Mailgun'
      });
      console.log('Mailgun test successful:', testResult);
      return testResult;
    } catch (error) {
      console.error('Mailgun test failed:', error);
      throw error;
    }
  }
}