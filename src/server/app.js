import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import emailRouter from './routes/email.js';
import calendarRouter from './routes/calendar.js';
import config from './config/index.js';
import dotenv from 'dotenv';


dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const mailgunApiKey = process.env.VITE_MAILGUN_API_KEY;
const mailgunDomain = process.env.VITE_MAILGUN_DOMAIN;
const serviceAccount = require('./key.json');

const app = express();
//for Calendar
// Create a JWT client using service account
const jwtClient = new google.auth.JWT(
    serviceAccount.client_email,
    null,
    serviceAccount.private_key,
    ['https://www.googleapis.com/auth/calendar'],
    null
  );
  
  // Middleware setup
  app.use(cors({ 
    credentials: true, 
    origin: 'http://localhost:8080'
  }));
  
  app.use(express.static(path.join(__dirname, '../../dist')));
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
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API routes
app.use('/api/email', emailRouter);
app.use('/api/calendar', calendarRouter);

// Serve the frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.get('/api/config', (req, res) => {
  res.json({
    mailgunDomain: mailgunDomain
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
    });
});

app.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
});

export default app;