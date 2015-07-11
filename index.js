"use strict";

var fs      	= require('fs')
  , http 		= require('http')
  , path 		= require('path')
  //, _ 			= require('lodash')
  , dispatcher 	= require('httpdispatcher')
  , colors 		= require('colors')
  , watch		= require('watch')
  ;

var entryPoint		= path.resolve(process.argv[2])
  , serverPort 		= 1337
  , serverDomain 	= '127.0.0.1'
  , serverUrl		= 'http://' + serverDomain + ':' + serverPort
  , currentDir 		= ''
  , fileExtension	= '.json'
  , resources		= {}
  ;



var addRoute = function(pageUrl, filePath){
	resources[pageUrl] = filePath;
	console.log(" + ".green + (serverUrl + pageUrl).cyan);
}

var rmRoute = function(pageUrl){
	delete resources[pageUrl];
	console.log(" - ".red + (serverUrl + pageUrl).cyan);
}

var serveRoute = function(request, response){
	var httpStatus = 200;
	var filePath = resources[request.url];
	if(request.method == 'GET' && filePath){
		fs.readFile(filePath, function (err, data) {
		    if(err) {        
		    	httpStatus = 500;
		  		console.log(" -> " + request.method + " " + serverUrl + request.url + ' ' + httpStatus.toString().red);
		        response.writeHead(httpStatus, {"Content-Type": "text/plain"});
		        response.write(err + "\n");
		        response.end();
		        return;
	      	}
	      	httpStatus = 200
		  	console.log(" -> " + request.method + " " + serverUrl + request.url + ' ' + httpStatus.toString().green);
	    	response.writeHead(httpStatus, {'Content-Type': 'application/json'});
	    	response.write(data.toString());
	    	response.end();
	    	return;
		});
	}else if(request.method == 'POST' || (request.method == 'PUT' && filePath)){
		request.on('data', function(chunk) {
	      	var dirContainer = entryPoint + request.url
			  , jsonContent
			  ;
			try {
		        jsonContent = JSON.parse(chunk.toString());
		    } catch (e) {
				httpStatus = 400;
				console.log(" -> " + request.method + " " + serverUrl + request.url + ' ' + httpStatus.toString().red);
				response.writeHead(httpStatus, {"Content-Type": "text/plain"});
			  	response.write("400 Bad request\n");
			  	response.end();
			  	return;
		    }
			fs.readdir(dirContainer, function(err, files){
				if(request.method == 'POST'){
					var id = files.length;
					do{
						jsonContent.id = id;
						filePath = dirContainer + '/' + id++ + fileExtension
					}while(fs.existsSync(filePath))	
				}
				var fileContent = JSON.stringify(jsonContent)
				fs.writeFile(filePath, fileContent, function(err) {
			    	if(err) {
    			    	httpStatus = 500;
				  		console.log(" -> " + request.method + " " + serverUrl + request.url + ' ' + httpStatus.toString().red);
				        response.writeHead(httpStatus, {"Content-Type": "text/plain"});
				        response.write(err + "\n");
				        response.end();
				        return;
			    	}
			      	httpStatus = 200
				  	console.log(" -> " + request.method + " " + serverUrl + request.url + ' ' + httpStatus.toString().green);
			    	response.writeHead(httpStatus, {'Content-Type': 'application/json'});
			    	response.write(fileContent);
			    	response.end();
			    	return;
				});
			})
	    });
		
	}else{
		httpStatus = 404;
		console.log(" -> " + request.method + " " + serverUrl + request.url + ' ' + httpStatus.toString().red);
		response.writeHead(httpStatus, {"Content-Type": "text/plain"});
	  	response.write("404 Not Found\n");
	  	response.end();
	  	return;
	}
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

watch.watchTree(entryPoint, function (f, curr, prev) {
  	var pageUrl = f.toString().replace(entryPoint, '').replace(fileExtension, '');
  	if(typeof f !== "object" && path.extname(f) == fileExtension){
  		if (prev === null) {
      		addRoute(pageUrl, f);
  	    } else if (curr.nlink === 0) {
    		rmRoute(pageUrl);
  	    }
  	}
  });

console.log('\nServer running at '.grey + serverUrl.cyan);

console.log('\nLoading directory '.grey + entryPoint.cyan);

walk(entryPoint,  function(err) {
  	if (err) throw err;
	
	console.log('\nLoading complete. '.green + 'Now in watch on '.grey + entryPoint.cyan);
});

http.createServer(function (req, res) {
  //dispatcher.dispatch(req, res);
  serveRoute(req, res);
})
.listen(serverPort, serverDomain);
