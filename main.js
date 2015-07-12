"use strict";

var fs      	= require('fs')
  , http 		= require('http')
  , path 		= require('path')
  , colors 		= require('colors')
  , Q			= require('q')
  ;

var entryPoint		= path.resolve(process.argv[2])
  , serverPort 		= 1337
  , serverDomain 	= '127.0.0.1'
  , serverUrl		= 'http://' + serverDomain + ':' + serverPort
  , fileExtension	= '.json'
  ;

var readFile = function(filePath){
	var deferred = Q.defer();
	fs.readFile(filePath, function (error, text) {
	    if (error) {
	        deferred.reject(new Error(error));
	    } else {
	        deferred.resolve(text);
	    }
	});
	return deferred.promise;
}

var readDir = function(dirPath){
	var deferred = Q.defer();
	fs.readdir(dirPath, function(error, filesList){
	    if (error) {
	        deferred.reject(new Error(dirPath + ': ' + error));
	    } else {
	        deferred.resolve(filesList);
	    }
	})
	return deferred.promise;
}

var readDirAndMergeContent = function(dirPath){
	var deferred 	= Q.defer()
	  , contentDir 	= []
	  ;

	readDir(dirPath)
	.then(function(filesList){
		filesList.forEach(function(file) { 
			if(path.extname(file) == fileExtension){
				var filePath = dirPath + '/' + file;
				try{
					contentDir.push(JSON.parse(fs.readFileSync(filePath)));
				}catch(err){
			        deferred.reject(new Error(filePath + ': ' + error));
				}
			}
		})
		deferred.resolve(JSON.stringify(contentDir));
	})
	.catch(function(error){
		deferred.reject(new Error(error));
	})
	return deferred.promise;
}


var reply = function(request, response, status, header, content, filePath){
	response.writeHead(status, header);
	if(content){
		response.write(content.toString());
	}
	response.end();
	console.log(" -> " + request.method + " " + serverUrl + request.url + ' ' + (status > 299 ? status.toString().red : status.toString().green) + (filePath ? ' -> ' + filePath.cyan : ''));
}

http.createServer(function (request, response) {
	var dirPath = entryPoint + request.url
	  , filePath = dirPath + fileExtension
	  ;

	/*
	Redirects all url that end with / to the same url without /
	e.g. http://127.0.0.1:1337/posts/ -> http://127.0.0.1:1337/posts
	*/
  	if(request.url.match(/.+\/$/)){
  		reply(request, response, 302, { 'Location': serverUrl + request.url.replace(/\/$/, '') });
	}

	/*
	On GET method, checks if file exists 
	e.g. http://127.0.0.1:1337/posts -> ~/posts.json
	*/
	else if(request.method == 'GET' && fs.existsSync(filePath)) {

		readFile(filePath)
		.then(function(content){
			reply(request, response, 200, {'Content-Type': 'application/json'}, content, filePath);
		})
		.catch(function(err){
			reply(request, response, 500, {'Content-Type': 'text/plain'}, err + "\n", filePath);
		})
	}

	/*
	On GET method, checks if directory exists 
	e.g. http://127.0.0.1:1337/posts -> ~/posts/
	*/
	else if(request.method == 'GET' && fs.existsSync(dirPath)) {
		readDirAndMergeContent(dirPath)
		.then(function(content){
			reply(request, response, 200, {'Content-Type': 'application/json'}, content, dirPath);
		})
		.catch(function(err){
			reply(request, response, 500, {'Content-Type': 'text/plain'}, dirPath + '/' + file + ': ' + err + "\n", dirPath);
		})
	}

	/*
	On POST method checks if directory exists or on PUT method checks if file exists 
	e.g. http://127.0.0.1:1337/posts -> ~/posts/
	*/
	else if((request.method == 'POST' && fs.existsSync(dirPath)) || (request.method == 'PUT' && fs.existsSync(filePath))){
		// Retrieve request content
		request.on('data', function(chunk) {
	      	var jsonContent;

			// Validate request content as JSON
			try {
		        jsonContent = JSON.parse(chunk.toString());
		    } 
			// If not a valid JSON, return an error 400
		    catch (e) {
		    	reply(request, response, 400, {'Content-Type': 'text/plain'}, "400 Bad request\n");
		    }

		    // Read inside directory
			fs.readdir(dirPath, function(err, files){

				// To create a new file, it searches for a new id and a new name
				if(request.method == 'POST'){
					var id = files.length;
					do{
						jsonContent.id = id;
						filePath = dirPath + '/' + id++ + fileExtension
					}while(fs.existsSync(filePath))	
				}

				// Prepare the JSON to be written in the file
				var content = JSON.stringify(jsonContent)

				// Write or overwrite the content
				fs.writeFile(filePath, content, function(err) {

					// If something goes wrong, it returns a 500 status error
			    	if(err) {
			    		reply(request, response, 500, {'Content-Type': 'text/plain'}, filePath + ': ' + err + "\n", filePath);
			    	}

			    	// If it is all done, it returns the updated content with a 200 http status
			    	reply(request, response, 200, {'Content-Type': 'application/json'}, content, filePath);
				});
			})
	    });
	}

	/*
	On DELETE method checks if directory exists 
	e.g. http://127.0.0.1:1337/posts -> ~/posts/
	*/
	else if(request.method == 'DELETE' && fs.existsSync(filePath)){

		// Delete file
		fs.unlink(filePath, function (err) {

			// If something goes wrong, it returns a 500 status error
	    	if(err) {
	    		reply(request, response, 500, {'Content-Type': 'text/plain'}, filePath + ': ' + err + "\n", filePath);
	    	}

	    	// If it is all done, it returns an empty content with a 200 http status
	    	reply(request, response, 200, {'Content-Type': 'text/plain'}, null, filePath);
		});
	}

	/*
	No directory or file found 
	*/
	else {
		reply(request, response, 404, {'Content-Type': 'text/plain'}, "404 Not Found\n");
	}

})
.listen(serverPort, serverDomain);