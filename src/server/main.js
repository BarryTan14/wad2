import express from "express";
import ViteExpress from "vite-express";
import logger from 'morgan';
import chalk from 'chalk';
import cookieParser from 'cookie-parser'
import session from 'express-session';
import mongoose from 'mongoose';
import cors from 'cors';

import dotenv from 'dotenv';
import userHandlerRouter from './routes/userhandler.js';
import transcribeHandlerRouter from './routes/transcribehandler.js';
import groupRouter from './routes/group.js';
import messagesRouter from './routes/messagesHandler.js';
import emailRouter from './routes/email.js';
import calendarRouter from './routes/calendar.js'

import {Server} from 'socket.io';
import {createServer} from "http";

dotenv.config();

const app = express();

const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        methods: ["GET", "POST"]
    }
});

// Add this in your main.js or App.vue


ViteExpress.config({mode: process.env.NODE_ENV});

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err))

/*var corsOptions = {
    origin: 'http://localhost:3000',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
app.use(cors(corsOptions));*/

app.use(express.json())
app.use(cookieParser())
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}))

app.use(express.urlencoded({extended: false}));
//app.use(express.multipart());

app.use('/user', userHandlerRouter);

app.use('/transcribe', transcribeHandlerRouter);

app.use('/group', groupRouter);

app.use('/api/email', emailRouter);

app.use('/api/calendar', calendarRouter);

messagesRouter(io);

//app.use('/ws', messagesRouter);


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
/*

const io = new Server({
    path:"/ws",
});


app.set('socketio',io);*/

httpServer.listen(3000, () => {
    console.log(`           ____
          /\\   \\
         /  \\   \\
        /    \\   \\
       /      \\   \\
      /   /\\   \\   \\
     /   /  \\   \\   \\
    /   /    \\   \\   \\
   /   /    / \\   \\   \\
  /   /    /   \\   \\   \\
 /   /    /---------'   \\
/   /    /_______________\\
\\  /                     /
 \\/_____________________/
░░      ░░░  ░░░░  ░░  ░░░░░░░░        ░░  ░░░░  ░░       ░░░        ░░░      ░░░░      ░░
▒  ▒▒▒▒  ▒▒  ▒▒▒▒  ▒▒  ▒▒▒▒▒▒▒▒▒▒▒  ▒▒▒▒▒  ▒▒▒▒  ▒▒  ▒▒▒▒  ▒▒  ▒▒▒▒▒▒▒▒  ▒▒▒▒  ▒▒  ▒▒▒▒▒▒▒
▓  ▓▓▓▓▓▓▓▓  ▓▓▓▓  ▓▓  ▓▓▓▓▓▓▓▓▓▓▓  ▓▓▓▓▓  ▓▓▓▓  ▓▓       ▓▓▓      ▓▓▓▓  ▓▓▓▓  ▓▓▓      ▓▓
█  ████  ██  ████  ██  ███████████  █████  ████  ██  ███  ███  ████████  ████  ████████  █
██      ████      ███        █████  ██████      ███  ████  ██        ███      ████      ██
•._.••´¯\`\`•.¸¸.•\`𝓨𝓸𝓾𝓻 𝓒𝓾𝓵𝓽𝓾𝓻𝓮, 𝓞𝓹𝓮𝓻𝓪𝓽𝓲𝓷𝓰 𝓪𝓽 𝓘𝓽𝓼 𝓟𝓮𝓪𝓴\`•.¸¸.•\`\`¯´••._.•
`)
});

ViteExpress.bind(app, httpServer);


/*
var server = ViteExpress.listen(app, 3000, () =>
    console.log(` _    _            _       _               _   _     _       __
| |  | |          | |     (_)             | | | |   (_)      \\ \\
| |  | | ___    __| | ___  _ _ __   __ _  | |_| |__  _ ___  (_) |
| |/\\| |/ _ \\  / _\` |/ _ \\| | '_ \\ / _\` | | __| '_ \\| / __|   | |
\\  /\\  /  __/ | (_| | (_) | | | | | (_| | | |_| | | | \\__ \\  _| |
 \\/  \\/ \\___|  \\__,_|\\___/|_|_| |_|\\__, |  \\__|_| |_|_|___/ (_) |
                                    __/ |                    /_/
                                   |___/`),
);*/
