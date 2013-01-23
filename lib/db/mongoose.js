var mongoose = require('mongoose');
var db = mongoose.connect('localhost', 'prefab');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
	console.log('mongoose has opened mongo db');
});
