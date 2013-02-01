//fake lib for testing requirejs

define([], function () {
	var url = 'http://localhost:3000'; 	// Web server URL
	return  io.connect(url);
});