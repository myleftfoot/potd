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
const fs = require('fs');
const path = require('path');
const request = require('superagent');
var progress = require('superagent-progress');

module.exports = RequestHandler;

// constructor
function RequestHandler(config) {
  this._config = config;

  this._getFileFromPath = (path) => {
    return path.substring(path.lastIndexOf('/') + 1);
  };

  return {
    retrievePOTD: () => {
      return new Promise((resolve, reject) => {
        let apiKey = this._config.get('api_key');
        let destination = this._config.get('destination_folder');

        request
          .get("https://api.nasa.gov/planetary/apod")
          .query({
            api_key: apiKey
          })
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json')
          .use(progress)
          .end((err, res) => {
            if (err) {
              if (err.response && err.response.text) {
                err = err.response.text;
              }
              reject(err);
            }
            else {
              res.body.destination = destination;
              resolve(res.body);
            }
          });
      });
    },
    saveFile: (responseBody) => {
      return new Promise((resolve, reject) => {
        let url = responseBody.hdurl;
        if (url) {
          let destination = responseBody.destination + '/' + this._getFileFromPath(url);
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
        if (this._config.get('update_exif') == false) {
          resolve(responseBody);
        }
        else if (responseBody && responseBody.localFile) {
          let localFile = responseBody.localFile;
          console.log('updating EXIF for file: %s', localFile);
          resolve(responseBody);
        }
      });
    },
    linkFile: (responseBody) => {
      return new Promise((resolve, reject) => {
        if (this._config.get('symlink_latest') == false) {
          resolve(responseBody);
        }
        else if (responseBody && responseBody.localFile) {
          let localFile = responseBody.localFile;
          console.log('linking %s to latest.jpg', localFile);
          let linkedFile = responseBody.destination + '/' + 'latest.jpg';

          fs.lstat(linkedFile, (error, status) => {
            if (error) {
              reject(error);
            }
            if (status.isSymbolicLink()) {
              let tempLinkedFile = linkedFile + '.tmp';
              fs.symlink(localFile, tempLinkedFile, (error, status) => {
                if (error) {
                  reject(error);
                }
                fs.rename(tempLinkedFile, linkedFile, (error, status) => {
                  if (error) {
                    reject(error);
                  }
                  resolve(responseBody);
                });

              });

            }
            else {
              fs.symlink(localFile, linkedFile, (err) => {
                if (err) {
                  reject(err);
                }
                resolve(responseBody);
              });
            }
          });
        }
      });
    }
  };
}
