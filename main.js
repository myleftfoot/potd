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
const path = require('path');
const nconf = require('nconf');
const request = require('superagent');
var progress = require('superagent-progress');
const requestHandler = require('./lib/request_handler');

function getUserHome() {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

nconf.argv()
  .env()
  .file({file: getUserHome() + '/.potd/config.json'});

let apiKey = nconf.get('api_key');
let destination = nconf.get('destination_folder');

console.log('NASA picture of the day.');
console.log('Retrieving picture info.');

request
  .get("https://api.nasa.gov/planetary/apod")
  .query({api_key: apiKey})
  .set('Content-Type', 'application/json')
  .set('Accept', 'application/json')
  .use(progress)
  .end((err, res) => {
    if (err) {
      if (err.response && err.response.text) {
        console.log(err.response.text);
      } else {
        console.log(err);
      }

      return;
    }
    res.body.destination = destination;
    requestHandler
      .saveFile(res.body)
      .then(requestHandler.updateEXIF)
      .then(requestHandler.linkFile)
      .catch((err) => {
        console.log(err);
      });
  });
