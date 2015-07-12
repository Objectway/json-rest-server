"use strict";

var fs      	= require('fs')
  , http 		= require('http')
  , path 		= require('path')
  , colors 		= require('colors')
  ;

var entryPoint		= path.resolve(process.argv[2])
  , serverPort 		= 1337
  , serverDomain 	= '127.0.0.1'
  , serverUrl		= 'http://' + serverDomain + ':' + serverPort
  , fileExtension	= '.json'
  ;

http.createServer(function (request, response) {
	/*
	Redirects all url that end with / to the same url without /
	e.g. http://127.0.0.1:1337/posts/ -> http://127.0.0.1:1337/posts
	*/
  	if(request.url.match(/.+\/$/)){
		console.log(" -> " + request.method + " " + serverUrl + request.url + ' 302'.red);
		response.writeHead(302, { 'Location': serverUrl + request.url.replace(/\/$/, '') });
		response.end();	
		return;
	}
	var dirPath = entryPoint + request.url
	  , filePath = dirPath + fileExtension
	  ;

	/*
	On GET method, checks if file exists 
	e.g. http://127.0.0.1:1337/posts -> ~/posts.json
	*/
	if(request.method == 'GET' && fs.existsSync(filePath)) {

		fs.readFile(filePath, function (err, data) {
		    if(err) {        
		  		console.log(" -> " + request.method + " " + serverUrl + request.url + ' 500'.red);
		        response.writeHead(500, {"Content-Type": "text/plain"});
		        response.write(err + "\n");
		        response.end();
		        return;
	      	}
		  	console.log(" -> " + request.method + " " + serverUrl + request.url + ' 200'.green + ' -> ' + filePath.cyan);
	    	response.writeHead(200, {'Content-Type': 'application/json'});
	    	response.write(data.toString());
	    	response.end();
	    	return;
		});
	}

	/*
	On GET method, checks if directory exists 
	e.g. http://127.0.0.1:1337/posts -> ~/posts/
	*/
	else if(request.method == 'GET' && fs.existsSync(dirPath)) {
		var contentDir = [];
		fs.readdir(dirPath, function(err, files){
			files.forEach(function(file) { 
				if(path.extname(file) == fileExtension){
					try{
						contentDir.push(JSON.parse(fs.readFileSync(dirPath + '/' + file)));
					}catch(err){
				  		console.log(" -> " + request.method + " " + serverUrl + request.url + ' 500'.red);
				        response.writeHead(500, {"Content-Type": "text/plain"});
				        response.write(dirPath + '/' + file + ': ' + err + "\n");
				        response.end();
				        return;
					}
				}
			})
			if(!response.finished){
			  	console.log(" -> " + request.method + " " + serverUrl + request.url + ' 200'.green + ' -> ' + dirPath.cyan);
		    	response.writeHead(200, {'Content-Type': 'application/json'});
		    	response.write(JSON.stringify(contentDir));
		    	response.end();
			}
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
				httpStatus = 400;
				console.log(" -> " + request.method + " " + serverUrl + request.url + ' ' + httpStatus.toString().red);
				response.writeHead(httpStatus, {"Content-Type": "text/plain"});
			  	response.write("400 Bad request\n");
			  	response.end();
			  	return;
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
				var fileContent = JSON.stringify(jsonContent)

				// Write or overwrite the content
				fs.writeFile(filePath, fileContent, function(err) {

					// If something goes wrong, it returns a 500 status error
			    	if(err) {
				  		console.log(" -> " + request.method + " " + serverUrl + request.url + ' 500'.red);
				        response.writeHead(500, {"Content-Type": "text/plain"});
				        response.write(filePath + ': ' + err + "\n");
				        response.end();
				        return;
			    	}

			    	// If it is all done, it returns the updated content with a 200 http status
				  	console.log(" -> " + request.method + " " + serverUrl + request.url + ' 200'.green + ' -> ' + filePath.cyan);
			    	response.writeHead(200, {'Content-Type': 'application/json'});
			    	response.write(fileContent);
			    	response.end();
			    	return;
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
		  		console.log(" -> " + request.method + " " + serverUrl + request.url + ' 500'.red);
		        response.writeHead(500, {"Content-Type": "text/plain"});
		        response.write(filePath + ': ' + err + "\n");
		        response.end();
		        return;
	    	}

	    	// If it is all done, it returns an empty content with a 200 http status
		  	console.log(" -> " + request.method + " " + serverUrl + request.url + ' 200'.green + ' -> ' + filePath.cyan);
	    	response.writeHead(200, {'Content-Type': 'application/plain'});
	    	response.end();
	    	return;
		});
	}

	/*
	No directory or file found 
	*/
	else {
		console.log(" -> " + request.method + " " + serverUrl + request.url + ' 404'.red);
		response.writeHead(httpStatus, {"Content-Type": "text/plain"});
	  	response.write("404 Not Found\n");
	  	response.end();
	  	return;
	}

})
.listen(serverPort, serverDomain);