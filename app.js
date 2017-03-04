var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var users = require('./routes/users');
var api = require('./routes/api');
var df = require('console-stamp/node_modules/dateformat');

var mad_glory = require('./external_calls/connect_mad_glory.js');

var app = express();
var app_api = express();

logger.token('formatted-date', function() {
  return '[' + df(new Date(), 'dd.mm.yy HH:MM:ss.l') + ']';});

var logger_format = ':formatted-date - :method :url :status :response-time ms - :res[content-length]';

require('log-timestamp')(function () {
  return '[' +  df(new Date(), 'dd.mm.yy HH:MM:ss.l') + '] - %s' });

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger(logger_format));
app_api.use(logger(logger_format));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app_api.use(bodyParser.urlencoded({ extended: true }));
app_api.use(bodyParser.json());
app.use(cookieParser());
// app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);
app_api.use('/api', api);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

var port = 3001;        // set our port

app_api.listen(port);
console.log('Magic happens on port ' + port);

// catch 404 and forward to error handler
app_api.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app_api.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
module.exports = app;
