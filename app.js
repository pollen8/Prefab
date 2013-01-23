
// -- Module dependencies.
var express     = require('express'),
    http        = require('http'),
    logo        = require('./lib/logo'),
    color       = require('colors'),
    fs          = require('fs');

// -- Create Express instance and export
var app         = express(),
    env         = app.settings.env,
    
// -- Import configuration
    conf        = require('./settings/config'),
    settings    = conf.settings;
    conf        (app, express, env);

// -- Bootstrap Config
require('./bootstrap').boot(app);




// -- Only listen on $ node app.js
logo.print();

var server = http.createServer(app); 
server.listen(settings.port, function(){
    console.log("Express server listening on "+" port %d ".bold.inverse.red+" in " + " %s mode ".bold.inverse.green + " //", settings.port, env);
    console.log('Using Express %s...', express.version.red.bold);
    
    var io = require('socket.io').listen(server);
    
    io.set('log level', 1);
    
    // -- Routes
    require('./routes')(app, io);
});
