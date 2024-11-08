import formData from 'form-data';
import Mailgun from 'mailgun.js';
import config from '../config/index.js';
import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api', 
  key: config.mailgun.apiKey
});

export async function sendEmail({ to, subject, text, html }) {
  if (!to || (Array.isArray(to) && to.length === 0)) {
    throw new Error('At least one recipient email address is required');
  }

  const sanitizedHtml = DOMPurify.sanitize(html);
  
  // Ensure 'to' is always an array
  const recipients = Array.isArray(to) ? to : [to];

  try {
    console.log('Sending email to:', recipients);
    const msg = await mg.messages.create(config.mailgun.domain, {
      from: `Event Invitation <mailgun@${config.mailgun.domain}>`,
      to: recipients,
      subject: subject,
      text: text,
      html: sanitizedHtml
    });
    
    console.log('Email sent successfully:', msg);
    return {
      id: msg.id,
      status: msg.status,
      message: 'Email sent successfully'
    };
  } catch (error) {
    console.error('Failed to send email:', error);
    
    if (error.status === 401) {
      throw new Error('Invalid Mailgun API key. Please check your configuration.');
    } else if (error.status === 404) {
      throw new Error('Invalid Mailgun domain. Please check your configuration.');
    } else if (error.status === 400) {
      throw new Error(`Invalid recipient email address or other validation error: ${error.details}`);
    }
    
    throw error;
  }
}