var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt');

var UserSchema = new Schema({
	username: {
		type: String,
		unique: true,
		required: true
	},
	password: {
		type: String,
		required: true
	},
	firstName: String,
	lastName: String,
	city: String,
	state: String,
	proposals: {},
	offers: {}
});

UserSchema.pre('save', function(next) {
	var user = this;

	if (this.isModified('password') || this.isNew) {
		bcrypt.genSalt(10, function(err, salt) {
			if (err) {
				return next(err);	
			}

			bcrypt.hash(user.password, salt, function(err, hash) {
				if (err) {
					return next(err);		
				}	

				user.password = hash;
				next();
			});
		});
	} else {
		return next();	
	}
});

UserSchema.methods.comparePassword = function(password, callback) {
	bcrypt.compare(password, this.password, function(err, isMatch) {
		if (err) {
			return callback(err);
		}	

		callback(null, isMatch);
	});
};

module.exports = mongoose.model('User', UserSchema);
