import express from "express";
import ViteExpress from "vite-express";
import logger from 'morgan';
import chalk from 'chalk';
import requestip from 'request-ip';
import cookieParser from 'cookie-parser'
import session from 'express-session';
import { User } from './models/User.js'
import { authMiddleware } from './middleware/auth.js'
import mongoose from 'mongoose';

import dotenv from 'dotenv';
dotenv.config();

const app = express();


ViteExpress.config({mode:process.env.NODE_ENV});

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err))

app.use(express.json())
app.use(cookieParser())
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false
}))

app.use(express.urlencoded({extended: false}));
//app.use(express.multipart());

import userHandlerRouter from './routes/userhandler.js';
app.use('/user', userHandlerRouter);

import transcribeHandlerRouter from './routes/transcribehandler.js';
app.use('/transcribe', transcribeHandlerRouter);

import groupRouter from './routes/group.js';
app.use('/group', groupRouter);

logger.token('status', function (req, res) {
    var status = res.statusCode;
    var color = status >= 500 ? '#ff0e00' // red
        : status >= 400 ? '#ffdd00' // yellow
            : status >= 300 ? '#00a6ff' // cyan
                : status >= 200 ? '#11ff00' // green
                    : '#ffffff' // no color
    return chalk.hex(color).bold(res.statusCode);
});

function getDateTimeMe() {
    var date = new Date();
    var weekDay = date.toLocaleString('default', {weekday: 'short'});
    var month = date.toLocaleString('default', {month: 'short'});
    var day = date.toLocaleString('default', {day: 'numeric'});
    var year = date.toLocaleString('default', {year: 'numeric'});
    var time = date.toLocaleTimeString('default', {hour12: false});

    return weekDay + " "
        + month + " "
        + day + " "
        + year + " "
        + time;
}

logger.token('date', function (req, res) {
    return getDateTimeMe();
});
app.use(logger(':date :status :method :url :response-time ms :res[content-length]'));

/*app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  //res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});*/

ViteExpress.listen(app, 3000, () =>
    console.log(` _    _            _       _               _   _     _       __  
| |  | |          | |     (_)             | | | |   (_)      \\ \\ 
| |  | | ___    __| | ___  _ _ __   __ _  | |_| |__  _ ___  (_) |
| |/\\| |/ _ \\  / _\` |/ _ \\| | '_ \\ / _\` | | __| '_ \\| / __|   | |
\\  /\\  /  __/ | (_| | (_) | | | | | (_| | | |_| | | | \\__ \\  _| |
 \\/  \\/ \\___|  \\__,_|\\___/|_|_| |_|\\__, |  \\__|_| |_|_|___/ (_) |
                                    __/ |                    /_/ 
                                   |___/`),
);
