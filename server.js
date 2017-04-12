var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var passport = require('passport');
var config = require('./config/database');
var routes = require('./app/routes/index')
var path = require('path');
var port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({
	extended: false
}));

app.use(morgan('dev'));

app.use(passport.initialize());

mongoose.connect(process.env.MONGODB_URI);

require('./config/passport.js')(passport);

app.use('/public', express.static(path.join(__dirname, 'public')));

routes(app, passport);

app.listen(port, () => {
  console.log('Booktrading app is running on port ' + port);
});
