/**
 * Copyright (c) 2016-present, Stéphane Trottier.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

var Promise = require('bluebird');
var fs =  require('fs');
// var fs = Promise.promisifyAll(require("fs"));
var request = require('superagent');
var progress = require('superagent-progress');

var getFileFromPath = (path) => {
  return path.substring(path.lastIndexOf('/') +1);
};

module.exports = {
  saveFile: (responseBody) => {
    return new Promise((resolve, reject) => {
      let url = responseBody.hdurl;
      if (url) {
        let destination = responseBody.destination + '/' + getFileFromPath(url);
        console.log('Downloading picture....');
        let stream = request
          .get(url)
          .use(progress)
          .pipe(fs.createWriteStream(destination));

        stream.on('finish', () => {
         responseBody.localFile = stream.path;
          resolve(responseBody);
        });

        stream.on('error', (err) => {
          reject(err);
        })
      }
    });
  },
  updateEXIF: (responseBody) => {
    return new Promise((resolve) => {
      if (responseBody && responseBody.localFile) {
        let localFile = responseBody.localFile;
        console.log('updating EXIF for file: %s', localFile);
        resolve(responseBody);
      }
    });
  },
  linkFile: (responseBody) => {
    return new Promise((resolve, reject) => {
      if(responseBody && responseBody.localFile) {
        let localFile = responseBody.localFile;
        console.log('linking %s to latest.jpg', localFile);
        let linkedFile = responseBody.destination + '/' + 'latest.jpg';

        fs.symlink(localFile, linkedFile,(err) => {
          if(err){
            if(err.code !== 'EEXIST') {
              reject(err);
            }
          }
          resolve(responseBody);
        });
      }
    });
  }
};

