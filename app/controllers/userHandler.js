var User = require('../models/user');
var Book = require('../models/book.js');

var userHandler = {
	offerTrade: (userOffering, bookId, callback) => {
		Book
			.findById({ '_id': bookId })
			.exec((err, doc) => {
				if (err) {
					throw err;	
				}

				var bookOwner = doc.owner;
				var update = { '$set': {} };

				update['$set']['proposals.' + bookId] = bookOwner; 

				User
					.findOneAndUpdate({ 'username': userOffering }, update)
					.exec((err, doc) => {
						if (err) {
							throw err;	
						}
					});

				var offer = 'offers.' + bookId;
				var update = { '$set': {} };
				update['$set'][offer] = userOffering;
				
				User
					.findOneAndUpdate({ 'username': bookOwner }, update)
					.exec((err, doc) => {
						if (err) {
							throw err;	
						}

						callback('Trade offer handled successfully');
					});
			});
	},

	acceptTrade: (userAccepting, bookId, callback) => {
		var offer = 'offers.' + bookId;
		var update = { '$unset': {} };
		update['$unset'][offer] = '';

		User
			.findOneAndUpdate({ 'username': userAccepting }, update)
			.exec((err, doc) => {
				if (err) {
					throw err;	
				}	

				var userOffering = doc.offers[bookId];
				var proposal = 'proposals.' + bookId;
				var update = { '$unset': {} };
				update['$unset'][proposal] = '';

				User
					.findOneAndUpdate({ 'username': userOffering }, update)
					.exec((err, doc) => {
						if (err) {
							throw err;	
						}

						var update = { '$set': { 'owner': userOffering } };
						
						Book
							.findOneAndUpdate({ 'owner': userAccepting }, update)						
							.exec((err, doc) => {
								if (err) {
									throw err;	
								}

								callback('Trade acceptance handled successfully.');
							});
					});
			});
	}
};

module.exports = userHandler;
