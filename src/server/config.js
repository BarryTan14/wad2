import dotenv from 'dotenv';

dotenv.config();

export default {
  mailgun: {
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN,
  }
};

console.log('Loaded configuration:');
console.log('API Key:', process.env.MAILGUN_API_KEY ? 'Set' : 'Not set');
console.log('Domain:', process.env.MAILGUN_DOMAIN);

if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
  console.error('Error: MAILGUN_API_KEY or MAILGUN_DOMAIN is not set in .env file');
}

export const googleApiConfig = {
  clientId: '991655882220-1p93r1uhaog6dj6ppjhd84q5r2hk77k4.apps.googleusercontent.com',
  apiKey: 'AIzaSyDY7JyyjlDma0O4ABb8BSUkBwX9VvxxM3k',
  discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
  scope: "https://www.googleapis.com/auth/calendar",
};