/** DB Shop class - working towards making it generic for any Prefab application */

mongoose = require('mongoose'),
Schema = mongoose.Schema;

Prefab = require('./prefab_schema').prefab;
Field = require('./prefab_schema').field;

var io = null;
var schemas = {};
var models = {};
var apps = {};
/**
 * Get the mongoose db schema for the application. The schema is stored in Prefab.mySchema mongoose table's field
 * 
 * @param   doc  doc  Mongoose Prefab document for the application
 */
function getSchema(doc) {
	
	if (schemas[doc.application] === undefined) {
		
		var mySchema = doc.mySchema.toObject();
		var schema = {};
		for (var i = 0; i < mySchema.length; i++) {
			fieldName = mySchema[i].name;
			
			// @TODO Cover all mongoose field types
			switch (mySchema[i].schemaType) {
			case 'String':
				schema[fieldName] = {type: String};
			}
		}
		var ThisSchema = new Schema(schema);
		
		schemas[doc.application] = ThisSchema;
	} else {
		ThisSchema = schemas[doc.application];
	}
	return ThisSchema;
}

/**
 * Internal Get model - loading and creating model schema if needed
 * 
 * @param doc
 * @param cb
 */
function _getModel(doc, cb) {
	var ThisSchema = getSchema(doc);
	if (models[doc.application] === undefined) {
		console.log('creating model'.green);
		var app = doc.application.charAt(0).toUpperCase() + doc.application.slice(1);
		var model = mongoose.model(app, ThisSchema);
		models[doc.application] = model;
	} else {
		console.log('using exisitng model'.red);
		model = models[doc.application];
	}
	cb(model);
}

/**
 * Loads the prefab application 
 * 
 * @param   string    application  Application name
 * @param   function  cb           Callback (error, application document)
 */
function loadApp(application, cb) {
	if (apps[application] !== undefined) {
		cb(null, apps[application]);
	}
	var search = {'application' : application};
	Prefab.findOne(search, function (err, doc) {
		if (err) {
			cb(err, null);
		} else {
			if (!doc) {
				
				// Create a new document with some default fields
				doc = new Prefab();
				doc.application = application;
				doc.formGrid = '{}';
				
				var fields = [{schemaType: 'String', 'label': 'Name', 'name': 'name'},
				              {schemaType: 'String', 'label': 'Age', 'name': 'age'}];
				addFields(doc, fields, function (err, docInstance) {
					apps[application] = doc;
					cb(err, doc);
				});
				
			}
			apps[application] = doc;
			cb(err, doc);
		}
	});
}

function addFields(doc, data, cb) {
	console.log('add fields', data);
	for (var i = 0; i < data.length; i++) {
		var field = new Field(data[i]);
		doc.mySchema.push(field);
	}
	console.log('doc', doc);
	doc.save(function (err, docInstance) {
		console.log('doc save', err);
		cb(err, doc);
	});
}

module.exports = {
	/**
	 * Find and load an application
	 * 
	 *  @param   string    application  Prefab application name to load
	 *  @param   function  cb           Callback function (error, array of all found model items)
	 */
	getItems: function (application, cb) {
		loadApp(application, function(err, doc) {
			if (err) {
				cb(err, doc);
			} else {
				_getModel(doc, function (model) {
					console.log('get model ', model);
					model.find({}, function (err, items) {
						cb(err, items);
					});
				});
			}
		});
	},
	
	/**
	 * Get the mongoose Model
	 * 
	 * @param   string    application  Application name
	 * @oaram   function  cb          Callback function (returns just the model)
	 */
	getModel: function (application, cb) {
		loadApp(application, function(err, doc) {
			if (err) {
				cb(err, doc);
			} else {
				_getModel(doc, function (model) {
					cb(model);
				});
			}
		});
	},
	
	/**
	 * Model find one wrapper
	 * 
	 * @param   string    application  Application name
	 * @param   string    id           Key value to search on
	 * @params  function  cb           Callback (error, item)
	 */
	findOne: function (application, id, cb) {
		loadApp(application, function(err, doc) {
			if (err) {
				cb(err, doc);
			} else {
				_getModel(doc, function (model) {
					var slug = 'name';
					var search = {};
					search[slug] = id;
					model.findOne(search, function (err, item) {
						cb(err, item);
					});
				})
			}
			
		});
	},
	
	getSlug: function() {
		return 'name';
	},
	
	setIo: function (io) {
		io = io;
		io.sockets.on('connection', function (socket) {
			
			socket.on('addFields', function (application, data) {
				console.log('addfields', application, data);
				//
				loadApp(application, function(err, doc) {
					if (err) {
						cb(err, doc);
					} else {
						addFields(doc, data, function (err, doc) {
							if (!err) {
								socket.emit('addFields');
							}
						});
					}
				});
			})
		});
		
	}
}

