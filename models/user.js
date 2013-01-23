/**
 * DB schema for users
 * see http://devsmash.com/blog/implementing-max-login-attempts-with-mongoose
 */

mongoose = require('mongoose'),
Schema = mongoose.Schema;

var passwordHash = require('password-hash');

// These values can be whatever you want - we're defaulting to a
// max of 5 attempts, resulting in a 2 hour lock
MAX_LOGIN_ATTEMPTS = 5,
LOCK_TIME = 2 * 60 * 60 * 1000;

// Get the user schema
//UserSchema = require('./schema/user');

UserSchema = new Schema({
    username: { type: String, required: true, index: { unique: true } },
    password: { type: String, required: true },
    registerDate: { type: Date, 'default': Date.now },
    loginAttempts: { type: Number, required: true, 'default': 0 },
    lockUntil: { type: Number }
});

UserSchema.virtual('isLocked').get(function() {
	
    // Check for a future lockUntil timestamp
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Expose enum on the model, and provide an internal convenience reference 
var reasons = UserSchema.statics.failedLogin = {
    NOT_FOUND: 0,
    PASSWORD_INCORRECT: 1,
    MAX_ATTEMPTS: 2
};


// Hash the password before saving
UserSchema.pre('save', function(next) {
    var user = this;
    // only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) return next();

    // generate a salt
    try {
    	var hash = passwordHash.generate(user.password);
      } catch (err) {
    	  return next(err);
      }
      user.password = hash;
      next();
});


UserSchema.methods.comparePassword = function(candidatePassword, cb) {
	if (!passwordHash.verify(candidatePassword, this.password)) {
		return cb(null, false);
	} else {
		cb(null, true);
	}
		
};

UserSchema.methods.incLoginAttempts = function(cb) {
	
    // If we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.update({
            $set: { loginAttempts: 1 },
            $unset: { lockUntil: 1 }
        }, cb);
    }
    // Otherwise we're incrementing
    var updates = { $inc: { loginAttempts: 1 } };
    
    // Lock the account if we've reached max attempts and it's not locked already
    if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked) {
        updates.$set = { lockUntil: Date.now() + LOCK_TIME };
    }
    return this.update(updates, cb);
};

UserSchema.statics.getAuthenticated = function(username, password, cb) {
    this.findOne({ username: username }, function(err, user) {
        if (err) return cb(err);

        // Make sure the user exists
        if (!user) {
            return cb(null, null, reasons.NOT_FOUND);
        }

        // Check if the account is currently locked
        if (user.isLocked) {
        	
            // Just increment login attempts if account is already locked
            return user.incLoginAttempts(function(err) {
                if (err) return cb(err);
                return cb(null, null, reasons.MAX_ATTEMPTS);
            });
        }

        // Test for a matching password
        user.comparePassword(password, function(err, isMatch) {
            if (err) return cb(err);

            // Check if the password was a match
            if (isMatch) {
            	
                // If there's no lock or failed attempts, just return the user
                if (!user.loginAttempts && !user.lockUntil) return cb(null, user);
                
                // Reset attempts and lock info
                var updates = {
                    $set: { loginAttempts: 0 },
                    $unset: { lockUntil: 1 }
                };
                return user.update(updates, function(err) {
                    if (err) return cb(err);
                    return cb(null, user);
                });
            }

            // Password is incorrect, so increment login attempts before responding
            user.incLoginAttempts(function(err) {
                if (err) return cb(err);
                return cb(null, null, reasons.PASSWORD_INCORRECT);
            });
        });
    });
};

module.exports = mongoose.model('User', UserSchema);
