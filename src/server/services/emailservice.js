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

export async function sendEmail(to, subject, text, html) {
  const sanitizedHtml = DOMPurify.sanitize(html);

  try {
    console.log('Sending email to:', to);
    const msg = await mg.messages.create(config.mailgun.domain, {
      from: `Event Invitation <mailgun@${config.mailgun.domain}>`,
      to: to, // This should now be a string of comma-separated email addresses
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
      throw new Error(`Bad request: ${error.details}`);
    }
    
    throw error;
  }
}