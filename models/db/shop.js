/** DB Shop class */

mongoose = require('mongoose'),
Schema = mongoose.Schema;

// Create the db schema - cant use name as var - res.locals.name cant be set??
var ShopSchema = new Schema({
	name: {type: String}
});

ShopSchema.statics.getSlug = function() {
	return 'name';
};

module.exports = mongoose.model('Shop', ShopSchema);
