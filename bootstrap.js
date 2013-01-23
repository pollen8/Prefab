
// -- Module dependencies
var express = require('express'),
mongooseForms = require('mongoose-forms');

// -- Global paths
var views = __dirname + '/views',
static_root = __dirname + '/public';

/**
 * Express base configuration 
 * Bootstrap
 */
module.exports.boot = function(app) {

    /**
     * Global configuration
     */
     app.configure(function() {

    	 var hbs = require('express-hbs');
    	 
    	 mongooseForms.bindHelpers(hbs.handlebars, 'bootstrap');
    	 
    	// Session handling
         app.use(express.cookieParser("thissecretrocks"));
         app.use(express.session({ secret: 'thissecretrocks', cookie: { maxAge: 600000 } }));
         
    	 app.locals.errors = '';
    	 app.locals.message = '';
    	 
         // -- Define view engine with its options
   
    	 app.engine('hbs', hbs.express3({
   		  defaultLayout: views + '/layout',
		  extname: ".hbs",
		  partialsDir: views + "/partials"
		}));
    	 app.set('view engine', 'hbs');
    	 app.set('views', __dirname + '/views');
         
         
         // -- Set uncompressed html output and disable layout templating
         app.locals({
             pretty : true
         });
         
         // -- Parses x-www-form-urlencoded request bodies (and json)
         app.use(express.bodyParser());
         app.use(express.methodOverride());
 
         app.use(function (req, res, next) {
        	 var error = req.session.error
        	 , msg = req.session.msg
        	 , success = req.session.success;
    		  delete req.session.error;
    		  delete req.session.msg;
    		  delete req.session.success;
    		  if (error) {
    			  res.locals.error = error;
    		  }
    		  if (msg) {
    			  res.locals.message = msg;
    		  }
    		  if (success) {
    			  res.locals.success = success;
    		  }
    		  next();
         });
         
         // -- Express routing
         app.use(app.router);
         
         // -- Static resources
         app.use(express.favicon());
         app.use(express.static(static_root));
         
         // -- 500 status
         app.use(function (err, req, res, next) {
             res.render('500', {
                 status: err.status || 500,
                 error: err
             });
         });

         // -- 404 status
         app.use(function (req, res, next) {
             res.render('404', {
                 status: 404,
                 url: req.url
             });
         });
         
         require('./lib/db/mongoose.js');

     });

};