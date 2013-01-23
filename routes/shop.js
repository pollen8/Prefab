/**
 * Routing logic for Shop
 */

module.exports = function (app, io) {

	var application = 'shop'; 
	
	Access = require('../models/access');
	Model = require('../models/db/' + application);
	

	var async = require('async');
	
	/**
	 * List available items
	 */
	app.get('/' + application, Access.allow, function (req, res) {
		console.log('show all ' + application);
		
		Model.find({}, function (err, items) {
			console.log(err, items);
			res.locals.items = items;
			res.locals.application = application;
			res.render(application + '/list');
		});
	});
	
	/**
	 * Create new item
	 */
	app.post('/' + application,  Access.allow, function (req, res) {
		
		var item = new Model(req.body);
		item.save(function (err) {
			console.log('save ' + application)
			req.session.msg = application + ' saved';
			res.render(application + '/list');
		});	
		
			
	});
	
	/**
	 * View an individual item
	 * Access.allow, 
	 */
	
	app.get('/' + application + '/:id', Access.allow, function (req, res) {
		var slug =  Model.getSlug();
		var search = {};
		search[slug] = req.params.id;
		Model.findOne(search, function (err, item) {
			if (err) {
				console.log('get ' + application + ' error', err);
				return handleError(err);
			}
			item = item.toObject();
			
			// Put in item property to avoid name clashes between the locals function and the item properties
			// E.g. item.name can't be set to res.locals.name as locals is a fn and already has the name property set
			res.locals.item = item;
			res.locals.application = application;
			res.render(application + '/item');
		})
		
	});
	
	
	/**
	 * Edit an individual item
	 * Access.allow, 
	 */
	
	app.get('/' + application + '/:id/edit', Access.allow, function (req, res) {
		var slug =  Model.getSlug();
		console.log('edit shop');
		var search = {};
		
		
		var Form    = require('mongoose-forms').Form;
		var form    = Form(Model);
		console.log(form);
		
		search[slug] = req.params.id;
		Model.findOne(search, function (err, item) {
			if (err) {
				console.log('get ' + application + ' error', err);
				return handleError(err);
			}
			item = item.toObject();
			
			// Put in item property to avoid name clashes between the locals function and the item properties
			// E.g. item.name can't be set to res.locals.name as locals is a fn and already has the name property set
			res.locals.item = item;
			res.render(application + '/edit', { form: form });
		})
		
	});
	
	/**
	 * Delete a room
	 */
	
	app.delete('/' + application + '/:id', Access.allow, function (req, res) {
		console.log('delete ' + application);
		Model.remove({_id: req.params.id}, function (err) {
		  if (err) return handleError(err);
		 res.redirect(application);
		});
	});

};