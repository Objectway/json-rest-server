"use strict";

var fs      	= require('fs')
  , http 		= require('http')
  , path 		= require('path')
  //, _ 			= require('lodash')
  , dispatcher 	= require('httpdispatcher')
  , colors 		= require('colors')
  ;

var entryPoint		= path.resolve(process.argv[2])
  , serverPort 		= 1337
  , serverDomain 	= '127.0.0.1'
  , serverUrl		= 'http://' + serverDomain + ':' + serverPort
  , currentDir 		= ''
  , fileExtension	= '.json'
  ;



var addRoute = function(pageUrl, filePath){
	console.log("\n\tGET ".green + (serverUrl + pageUrl).cyan);
  	dispatcher.onGet(pageUrl, function(req, res) {
	    fs.readFile(filePath, function (err, data) {
		  	if (err) throw err;
		  	console.log("\n\t GET " + serverUrl + pageUrl);
	    	res.writeHead(200, {'Content-Type': 'application/json'});
	    	res.end(data.toString());
		});
	});
}

var walk = function(dir, done) {
  fs.readdir(dir, function(err, list) {
    if (err) 
    	return done(err);
    
    var pending = list.length;
    
    if (!pending) 
    	return done(null);
    
    list.forEach(function(file) {
      
      file = path.resolve(dir, file);
      
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            if (!--pending) done(null);
          });
        } else {
          if(path.extname(file) == fileExtension){
          	var pageUrl = file.replace(entryPoint, '').replace(fileExtension, '');
          	addRoute(pageUrl, file)
          }
          if (!--pending) done(null);
        }
      });
    });
  });
};

console.log('\nServer running at '.grey + serverUrl.cyan);

console.log('\nLoading directory '.grey + entryPoint.cyan);

walk(entryPoint,  function(err) {
  	if (err) throw err;
	
	console.log('\nAll available resourses are loaded'.green);
	console.log('\nRequests: '.gray);
});

http.createServer(function (req, res) {
  dispatcher.dispatch(req, res);
})
.listen(serverPort, serverDomain);
