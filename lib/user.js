// check out https://github.com/visionmedia/node-pwd

/**
* Module dependencies.
*/

// Put back in on linux server
var crypto = require('crypto');

UserDb = require('./db/schema/user');


/**
* Bytesize.
*/

var len = 128;

/**
* Iterations. ~300ms
*/

var iterations = 12000;

/**
* Hashes a password with optional `salt`, otherwise
* generate a salt for `pass` and invoke `fn(err, salt, hash)`.
*
* @param {String} password to hash
* @param {String} optional salt
* @param {Function} callback
* @api public
*/

hash = function (pwd, salt, fn) {
  if (3 == arguments.length) {
    crypto.pbkdf2(pwd, salt, iterations, len, fn);
  } else {
    fn = salt;
    crypto.randomBytes(len, function(err, salt){
      if (err) return fn(err);
      salt = salt.toString('base64');
      crypto.pbkdf2(pwd, salt, iterations, len, function(err, hash){
        if (err) return fn(err);
        fn(null, salt, hash);
      });
    });
  }
};
 
//dummy database

var users = {
  tj: { name: 'tj' }
};

// when you create a user, generate a salt
// and hash the password ('foobar' is the pass here)

hash('foobar', function(err, salt, hash){
  if (err) throw err;
  // store the salt & hash in the "db"
  users.tj.salt = salt;
  users.tj.hash = hash;
});

//Authenticate using our plain-object database of doom!

exports.authenticate = function (name, pass, fn) {
	if (!module.parent) {
		  console.log('authenticating %s:%s', name, pass);
	}
	var user = users[name];
	// query the db for the given username
	if (!user) {
		return fn(new Error('cannot find user'));
	}
	// apply the same algorithm to the POSTed password, applying
	// the hash against the pass / salt, if there is a match we
	// found the user
	hash(pass, user.salt, function (err, hash) {
	  if (err) {
		  return fn(err);
	  }
	  if (hash == user.hash) {
	  	return fn(null, user);
	  }
	  fn(new Error('invalid password'));
	});
};

exports.create = function (name, pass, fn) {
	user.find({ username: 'rob' }, null, function (err, users) {
		
		console.log('found', users);
	})
	console.log('create' , name,  pass);
	return fn(new Error('cant create'));
};

exports.restrict = function (req, res, next) {
	if (req.session.user) {
		next();
	} else {
		req.session.error = 'Access denied!';
		res.redirect('/login');
	}
};

exports.enqueueMessage = function (req, res, next) {
	var err = req.session.error
	, msg = req.session.msg
	success = req.session.success;
	  delete req.session.error;
	  delete req.session.success;
	  console.log('app use middleware for message', err, msg);
	  res.locals.message = '';
	  if (err) {
		  res.locals.error = err;
	  }
	  if (msg) {
		  res.locals.message = msg;
	  }
	  if (success) {
		  res.locals.succsss = success;
	  }
	  next();
};
