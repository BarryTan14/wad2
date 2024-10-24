import express from "express";
import ViteExpress from "vite-express";
import logger from 'morgan';
import chalk from 'chalk';

const app = express();

ViteExpress.config({mode:"development"});

app.use(express.json());
app.use(express.urlencoded({extended: false}));
//app.use(express.multipart());

import userHandlerRouter from './userhandler/userhandler.js';
app.use('/user', userHandlerRouter);

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
    console.log("Server is listening on port 3000..."),
);
