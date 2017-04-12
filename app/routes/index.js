var User = require('../models/user');
var Book = require('../models/book');
var userHandler = require('../controllers/userHandler');
var config = require('../../config/database');
var jwt = require('jwt-simple');

module.exports = (app, passport) => {
	app.route('/')
		.get((req, res) => {
			res.sendFile(process.cwd() + '/public/index.html');
		});

	app.route('/api/books')
		.get((req, res) => {
			Book
				.find({}, (err, docs) => {
					if (err) {
						throw err;	
					}	

					res.json({
						books: docs	
					});
				});
		});

	app.route('/api/signup')
		.post((req, res) => {
				if (!req.body.username || !req.body.password) {
					res.json({
						success: false,
						msg: 'Username and password are required.'
					});
				} else {
					var newUser = new User({
						username: req.body.username,
						password: req.body.password
					});

					newUser.save((err) => {
						if (err) {
							res.json({
								success: false,
								msg: 'Sign up unsuccessful.'
							});
						}	else {
							res.json({
								success: true,
								msg: 'Successfully created user!'
							});
						}
					});
				}	
		});

	app.route('/api/authenticate')
		.post((req, res) => {
			User.findOne({
				username: req.body.username
			},
			(err, user) => {
				if (err) throw err;
		 
				if (!user) {
					res.send({ 
						success: false,
						msg: 'Authentication failed.'
					});
				} else {
					// check if password matches
					user.comparePassword(req.body.password, (err, isMatch) => {
						if (isMatch && !err) {
							// if user is found and password is right create a token
							var token = jwt.encode(user, config.secret);
							// return the information including token as JSON
							res.json({
								success: true,
								token: 'JWT ' + token
							});
						} else {
							res.send({
								success: false,
								msg: 'Authentication failed.'
							});
						}
					});
				}
			});
		});

	app.route('/api/memberinfo')
		.get(passport.authenticate('jwt', { session: false }), (req, res) => {
			var token = getToken(req.headers);

			if (token) {
				var decoded = jwt.decode(token, config.secret);

				User.findOne({
					username: decoded.username
				}, 
				(err, user) => {
						if (err) throw err;
		 
						if (!user) {
							res.status(403).send({
								success: false,
								msg: 'Authentication failed'
							});
						} else {
							Book
								.find({ 'owner': user.username }, (err, docs) => {
									res.json({
										success: true,
										msg: {
											user: user,
											books: docs
										} 
									});		
								});
						}
				});
			} else {
				res.status(403).send({
					success: false,
					msg: 'Invalid token provided.'
				});
			}
		});

	app.route('/api/addbook')
		.post(passport.authenticate('jwt', { session: false }), (req, res) => {
			console.log('title', req.body.title);
			console.log('owner', req.body.owner);
			console.log('author', req.body.author);

			var newBook = new Book({
				title: req.body.title,
				author: req.body.author,
				owner: req.body.owner
			});

			newBook.save((err) => {
				if (err) {
					console.log(err);

					res.status(403).send({
						success: false,
						msg: 'The book could not be added.'
					});
				}	

				res.json({
					success: true,
					msg: 'The book was added.'
				});
			});
		});

	app.route('/api/update-profile')
		.post(passport.authenticate('jwt', { session: false }), (req, res) => {
			var token = getToken(req.headers);

			if (token) {
				var decoded = jwt.decode(token, config.secret);
				var username = decoded.username;
				var firstName = req.body.firstName;
				var lastName = req.body.lastName;
				var city = req.body.city;
				var state = req.body.state;

				var update = { '$set': {} };

				update['$set']['city'] = city;
				update['$set']['firstName'] = firstName;
				update['$set']['lastName'] = lastName;
				update['$set']['state'] = state;

				User
					.findOneAndUpdate({ 'username': username }, update)
					.exec((err, doc) => {
						if (err) {
							throw err;	
						}

						res.json(doc);
					});
			}
			
		});

	app.route('/api/offer/:bookId')
		.post(passport.authenticate('jwt', { session: false }), (req, res) => {
			var token = getToken(req.headers);

			if (token) {
				var decoded = jwt.decode(token, config.secret);
				var userOffering = decoded.username;
				var bookId = req.params.bookId;

				userHandler.offerTrade(userOffering, bookId, (msg) => {
					res.json({
						success: true,
						msg: msg
					});
				});
			} else {
				res.status(403).send({
					success: false,
					msg: 'Authentication failed.'
				});
			}
		});
 
	app.route('/api/accept/:bookId')
		.post(passport.authenticate('jwt', { session: false }), (req, res) => {
			var token = getToken(req.headers);

			if (token) {
				var decoded = jwt.decode(token, config.secret);
				var userAccepting = decoded.username;
				var bookId = req.params.bookId;

				userHandler.acceptTrade(userAccepting, bookId, (msg) => {
					res.json({ msg: msg });
				});
			} else {
				res.status(403).send({
					success: false,
					msg: 'Authentication failed.'
				});
			}
		});

	app.route('/api/get-book-title/:id')
		.get((req, res) => {
			var bookId = req.params.id;

			Book
				.findById(bookId, (err, doc) => {
					if (err) {
						throw err;	
					}	

					res.json({
						book: doc	
					});
				});
		});

	var getToken = (headers) => {
		if (headers && headers.authorization) {
			var parted = headers.authorization.split(' ');

			if (parted.length === 2) {
				return parted[1];
			} else {
				return null;
			}
		} else {
			return null;
		}
	};
};
