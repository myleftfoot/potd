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
const gm = require('gm').subClass({imageMagick: true});

module.exports = RequestHandler;

// constructor
function RequestHandler(config) {
  this._config = config;

  this._getFileFromPath = (path) => {
    return path.substring(path.lastIndexOf('/') + 1);
  };

  this._linkFile = (source, destination) => {
    return new Promise((resolve, reject) => {
      console.log('linking %s to %s', source, destination);
      fs.lstat(source, (error, status) => {
        if (status && status.isSymbolicLink()) {
          let tempLinkedFile = source + '.tmp';
          fs.symlink(destination, tempLinkedFile, (error, status) => {
            if (error) {
              reject(error);
            }
            fs.rename(tempLinkedFile, source, (error, status) => {
              if (error) {
                reject(error);
              }
              resolve("success");
            });

          });

        }
        else {
          fs.symlink(destination, source, (err) => {
            if (err) {
              reject(err);
            }
            resolve("success");
          });
        }
      });
    });
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
    convertToPNG: (responseBody) => {
      return new Promise((resolve, reject) => {
        if (this._config.get('convert_to_png') == false) {
          resolve(responseBody);
        } else if (responseBody && responseBody.localFile) {
          console.log('converting image to png');
          let fileName = path.basename(responseBody.localFile, '.jpg');
          let destination = `${responseBody.destination}/${fileName}.png`;
          gm(responseBody.localFile)
            .write(destination, (err) => {
              if(err) {
                reject(err);
              }
              responseBody.localPNGFile = destination;
              resolve(responseBody);
            });
        }
      });
    },
    linkFile: (responseBody) => {
      return new Promise((resolve, reject) => {
        if (this._config.get('symlink_latest') == false) {
          resolve(responseBody);
        }
        else if (responseBody && responseBody.localFile) {
          var self = this;
          let localFile = responseBody.localFile;
          let linkedFile = `${responseBody.destination}/latest.jpg`;
          
          return self._linkFile(linkedFile, localFile)
            .then((status) => {
              if (!responseBody.localPNGFile) {
              resolve(responseBody);
              } else {
                let linkedPNGFile = `${responseBody.destination}/latest.png`;
                self._linkFile(linkedPNGFile, responseBody.localPNGFile)
                .then((status) => {
                  resolve (responseBody);
                });
              }
            });
        }
      });
    }
  };
}
