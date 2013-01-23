module.exports.allow = function (req, res, next) {
	if (req.session.user) {
		console.log('allowed');
	  next();
	} else {
		console.log('restricted');
	  req.session.error = 'Access denied!';
	  console.log(req.session.error);
	  res.redirect('/login');
	}
};