#!/usr/bin/env node
/**
 * Copyright (c) 2016-present, Stéphane Trottier.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

const fs = require('fs');
const nconf = require('nconf');
var RequestHandler = require('./lib/request_handler');

function getUserHome() {
  return process.env['HOME'];
}

// Read configurations
nconf
  .argv()
  .env()
  .file({file: getUserHome() + '/.potd/config.json'});

// set default configurations
nconf.defaults({
  'api_key': 'DEMO_KEY',
  'destination_folder': '.',
  'symlink_latest': false,
  'clear_exif': false,
  'update_exif': false
});

console.log('NASA picture of the day.');
console.log('Retrieving picture info.');

if(nconf.get('api_key') === 'DEMO_KEY') {
  console.warn('WARNING: api_key not set using DEMO_KEY. Please get an api key from https://api.nasa.gov/');
}

var handler = new RequestHandler(nconf);

handler
  .retrievePOTD()
  .then(handler.saveFile)
  .then(handler.updateEXIF)
  .then(handler.convertToPNG)
  .then(handler.linkFile)
  .catch((err) => {
    console.log(err);
  });
