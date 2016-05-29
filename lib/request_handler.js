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
const fs = require("fs");
const request = require('superagent');
var progress = require('superagent-progress');

module.exports = {
    saveFile: (responseBody, destination) => {
        return new Promise((response) => {
            let url = responseBody.hdurl;
            if(url){
                console.log('Downloading picture....');
                let stream = request
                    .get(url)
                    .use(progress)
                    .pipe(fs.createWriteStream(destination + '/current.jpg'));
                responseBody.localFile = stream.path;
                return response(responseBody);
            }

            return response(null);
        });
    },
    updateEXIF: (responseBody) => {
        return new Promise((response) => {
            if(responseBody && responseBody.localFile) {
                console.log('updating EXIF for file: %s', responseBody.localFile);
                return response(responseBody);
            }
            
            return response(null);
        });
    }
};

