#!/usr/bin/env node

try{
  require("index.js")(process.argv[2]);
}catch(err){
	console.error("You must insert a valid path as parameter".red + "\nTry with something like this: ".grey + "json-rest-server ../mydirectory".cyan);
}
