#!/usr/bin/env node
const fs = require("fs");
const path = require('path');
const nconf = require('nconf');
const ProgressBar = require('progress');
const request = require('superagent');
var progress = require('superagent-progress');

function getUserHome() {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

nconf.argv()
  .env()
  .file({ file: getUserHome() + '/.potd/config.json' });

let apiKey = nconf.get('api_key');
let destination = nconf.get('destination_folder');

console.log('NASA picture of the day.');
console.log('Retrieving picture info.')

request
  .get("https://api.nasa.gov/planetary/apod")
  .query({ api_key: apiKey })
  .set('Content-Type', 'application/json')
  .set('Accept', 'application/json')
  .use(progress)
  .end((err, res) => {
    if(err) {
      if(err.response && err.response.text) {
        console.log(err.response.text);
      } else {
        console.log(err);
      }

      return;
    }
    if(res.body.hdurl){
    	console.log('Downloading picture....')
    	let stream = request
        .get(res.body.hdurl)
        .use(progress)
        .pipe(fs.createWriteStream(destination + '/current.jpg'));
    }
  });
