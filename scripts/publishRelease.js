//"use strict";

var exec = require("child_process").exec;
//var cwd = require('cwd');
//var path = require('path');

// Package extension
var command = `tfx extension create --overrides-file release.json --manifest-globs vss-extension-release.json --no-prompt --json`;
//var pkg = File.join(cwd, '');
//var test = `system("cd")`;

//exec(test, stdout => {
//	console.log(`${stdout}`);
//});

//var outputPath = "";

//exec('cd', (err, stdout, stderr) => {
//  if (err) {
//    // node couldn't execute the command
//    return;
//  }

//  // the *entire* stdout and stderr (buffered)
//  console.log(`stdout: ${stdout}`);
//  console.log(`stderr: ${stderr}`);
//  outputPath = `${stdout}/dist`
//});

exec(command, { 
    "cwd": "./dist"
//	outputPath
}, (error, stdout) => {
    if (error) {
        console.error(`Could not create package: '${error}'`);
        return;
    }
    
    let output = JSON.parse(stdout);
    
    console.log(`Package created ${output.path}`);
    
    var command = `tfx extension publish --vsix ${output.path} --no-prompt`;
    exec(command, (error, stdout) => {
        if (error) {
            console.error(`Could not create package: '${error}'`);
            return;
        }
        
        console.log("Package published.");
    });
});