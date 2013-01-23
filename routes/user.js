/**
 * Routing logic for log-in, out, authorization
 */

module.exports = function (app) {

	User = require('../models/user');
	Access = require('../models/access');
	
	app.get('/', function(req, res){
		  res.render('index');
	});
	
	app.get('/login', function (req, res) {
		res.locals.referrer =  req.header('Referrer');
		if (res.locals.referrer == '') {
			res.locals.referrer = '/';
		}
		res.render('login');
	});
	
	app.post('/login', function (req, res) {
	  User.getAuthenticated(req.body.username, req.body.password, function (err, user, msg) {
		  if (err) {
			  console.log(err);
			  res.redirect('login');
		  }
	    if (user) {
	      // Regenerate session when signing in
	      // to prevent fixation
	      req.session.regenerate(function(){
	        // Store the user's primary key
	        // in the session store to be retrieved,
	        // or in this case the entire user object
	        req.session.user = user;
	        console.log('logged in req.session.user = ', req.session.user);
	        req.session.success = 'Authenticated as ' + user.username
	          + ' click to <a href="/logout">logout</a>';
	        var view = typeof(req.body.redirect) === 'undefined' ? 'back' : req.body.redirect;
	        res.redirect(view);
	      });
	    } else {
	      req.session.error = 'Authentication failed, please check your '
	        + ' username and password. ' + msg;
	      res.redirect('back');
	    }
	  });
	});
	
	app.post('/register', function (req, res) {
		var newuser = new User({'username': req.body.username, 'password': req.body.password});
		newuser.save(function (err) {
			if (err) {
				req.session.error = 'Registration failed, please check your credentials';
				res.redirect('register');
			} else {
				// Regenerate session when signing in
			    // to prevent fixation
				req.session.regenerate(function () {
				
					// Store the user's primary key
			        // in the session store to be retrieved,
			        // or in this case the entire user object
			        req.session.user = newuser;
			       req.session.success = 'Authenticated as ' + newuser.username
			          + ' <a href="/logout">logout</a>. ';
			        res.redirect('back');
				});
			}
		});
	});
	
	app.get('/register', function (req, res) {
		res.render('register');
	});
	
	app.get('/logout', function(req, res){
		// destroy the user's session to log them out
		// will be re-created next request
		req.session.destroy(function(){
			res.redirect('/');
		});
	});
};