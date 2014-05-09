/*******************************************************************************
Copyright 2014 CREATE-NET
Developed for COMPOSE project (compose-project.eu)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
******************************************************************************/

(function() {

    var readDefinition = {
        titanium: function(filename, compose, success, failure) {

            var readf = function(filepath) {

                var readFile = Titanium.Filesystem.getFile(filepath);
                if (readFile.exists()) {

                    var readContents = readFile.read();
                    var data = readContents.text;

                    return JSON.parse(data);
                }
                return false;
            };

            var basePath = Titanium.Filesystem.getResourcesDirectory() + Titanium.Platform.osname + "/";
            var filepath = basePath + compose.util.getDefinitionsPath() + filename + ".json";

            var data = readf(filepath);
//            Ti.API.log(JSON.stringify(data));
            if(data) {
                success(data);
                return;
            }
            else {
                basePath = Titanium.Filesystem.getResourcesDirectory() + "/";
                filepath = basePath + compose.util.getDefinitionsPath() + filename + ".json";
                var data = readf(filepath);
                if(data) {
                    success(data);
                    return;
                }
            }

            failure(new Error("Errore reading definition"));
        },
        node: function(filename, compose, success, failure) {
            var path = compose.util.getDefinitionsPath() + filename + ".json";
            var buffer = require('fs').readFile(path, function(err, data) {
                if(err) {
                    failure(err);
                    return;
                }

                // Both of the following variables are scoped to the callback of fs.readFile
                var data = data.toString();
                success(JSON.parse(data));
            });
        },
        browser: function(filename, compose, success, failure) {
            failure(new Error("Not implementend yet!"));
        }
    };

    var reader = {};
    reader.setup = function(compose) {

        if (!readDefinition[compose.config.platform]) {
            throw new Error("Platform not supported");
        }

        reader.read = function(file) {
            return new compose.lib.Promise(function(success, failure) {
                readDefinition[compose.config.platform](file, compose, success, failure);
            });

        };
    };

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = reader;
    }
    else {
        if (typeof define === 'function' && define.amd) {
            define(['compose'], function(compose) {
                return reader;
            });
        }
        else {
            window.Compose.Reader = reader;
        }
    }

})();

