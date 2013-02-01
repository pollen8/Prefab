/** DB Prefab Application class */

mongoose = require('mongoose'),
Schema = mongoose.Schema;

var FieldSchema = new Schema({
	schemaType: {type: String, required: true},
	name: {type: String, required: true, lowercase: true, trim: true},
	label: String,
	suboptions: {type: String},
	tip: {type: String}
});

// Create the db schema
var PrefabSchema = new Schema({
	application: {type: String, required: true, index: { unique: true }},
	description: {type: String},
	creator: {type: Schema.Types.ObjectId, ref: 'User' },
	createDate: {type: Date, 'default': Date.now },
	formGrid : {type: String},
	mySchema: [FieldSchema]
});

module.exports = {
	prefab: mongoose.model('Prefab', PrefabSchema),
	field: mongoose.model('Field', FieldSchema)
}
