/**
 * Routing logic for Shop
 */

module.exports = function (app, io) {

	var application = 'shop'; 
	
	Access = require('../models/access');
	Model = require('../models/prefab');
	Model.setIo(io);

	var async = require('async');
	
	/**
	 * List available items
	 */
	app.get('/' + application, Access.allow, function (req, res) {
		console.log('get items');
		
		Model.getItems(application, function (err, items) {
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
			req.session.msg = application + ' saved';
			res.render(application + '/list');
		});	
	});
	
	/**
	 * View an individual item
	 * Access.allow, 
	 */
	
	app.get('/' + application + '/:id', Access.allow, function (req, res) {
		Model.findOne(application, req.params.id, function (err, item) {
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
		var Form = require('mongoose-forms').Form;
		
		// Get the model
		Model.getModel(application, function (m) {
			
			// Bind model to the orm
			var form = Form(m);
			
			// Find the current model
			Model.findOne(application, req.params.id, function (err, item) {
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
			
		})
	});
	
	/**
	 * Delete a room
	 */
	
	app.delete('/' + application + '/:id', Access.allow, function (req, res) {
		Model.remove({_id: req.params.id}, function (err) {
		  if (err) return handleError(err);
		 res.redirect(application);
		});
	});

};