const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const methodOverride = require('method-override');
const path = require('path');

const routes = require('./routes/index');
const books = require('./routes/books');
const patrons = require('./routes/patrons');
const loans = require('./routes/loans');

const app = express();

// Views and View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');


// Various settings
app.use(methodOverride('_method'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/static', express.static(path.join(__dirname, 'public')));


// Routes
app.use('/', routes);
app.use('/books', books);
app.use('/patrons', patrons);
app.use('/loans', loans);

// // Error handlers

// Development error handler
// Will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
      res.status(err.status || 500);
      res.render('error', {
        message: err.message,
        error: err
      });
    });
  }
  
  // Production error handler
  // No stacktraces leaked to user
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: {}
    });
  });

  // Listening to port
  app.listen(3000);
  
  
  module.exports = app;