#!/usr/bin/env node
var commandLineArgs = require("command-line-args")
  , colors = require('colors')
  , cli = commandLineArgs([
    { name: "port", alias: "P", type: Number, defaultValue: 3000 },
    { name: "allowCORS", alias: "C", type: Boolean, defaultValue: false },
    { name: "help", alias: "H", type: Boolean, defaultValue: false }
  ])
  , directory = process.argv[2] || "."
  , usage = cli.getUsage()
  , options = cli.parse()
  ;

if(options.help){
  console.log(usage);
  console.log("# ".gray + "json-rest-server ../mydirectory -P 3000\n".cyan);
}else{
  try{
    require("./index.js")(directory, options.port, options.allowCORS)();
  }catch(err){
    console.error("You must insert a valid path as parameter".red + "\nTry with something like this: ".grey + "json-rest-server ../mydirectory".cyan);
    console.log(usage)
  }
}
