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