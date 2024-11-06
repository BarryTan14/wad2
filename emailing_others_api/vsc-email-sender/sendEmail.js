const formData = require('form-data');
const Mailgun = require('mailgun.js');
const config = require('./config');

const mailgun = new Mailgun(formData);
const mg = mailgun.client({username: 'api', key: config.MAILGUN_API_KEY});

async function sendEmail(to, subject, text, html) {
  // Validation checks
  if (!config.MAILGUN_API_KEY) {
    throw new Error('MAILGUN_API_KEY is not set in environment variables');
  }
  if (!config.MAILGUN_DOMAIN) {
    throw new Error('MAILGUN_DOMAIN is not set in environment variables');
  }

  console.log('Sending email with the following configuration:');
  console.log('Domain:', config.MAILGUN_DOMAIN);
  console.log('API Key length:', config.MAILGUN_API_KEY.length);
  console.log('API Key prefix:', config.MAILGUN_API_KEY.substring(0, 5) + '...');
  
  // Validate email format
  if (!to || !to.includes('@')) {
    throw new Error('Invalid recipient email address');
  }

  try {
    const msg = await mg.messages.create(config.MAILGUN_DOMAIN, {
      from: `Mailgun Test <mailgun@${config.MAILGUN_DOMAIN}>`,
      to: [to],
      subject: subject,
      text: text,
      html: html
    });
    
    console.log('Email sent successfully');
    console.log('Message ID:', msg.id);
    console.log('Status:', msg.status);
    return msg;
  } catch (error) {
    console.error('Failed to send email:');
    console.error('Status code:', error.status);
    console.error('Error message:', error.message);
    
    if (error.status === 401) {
      console.error('Authentication failed. Please check your API key.');
      console.error('Make sure you are using the Private API key, not the Public API key.');
    } else if (error.status === 404) {
      console.error('Domain not found. Please check your domain configuration.');
    }
    
    if (error.details) {
      console.error('Additional error details:', error.details);
    }
    
    throw error;
  }
}

module.exports = { sendEmail };