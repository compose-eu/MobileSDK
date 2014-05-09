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


var DEBUG = false;
var d = function(m) { DEBUG && console.log(m); };

var http = require("http");
var parseUrl = require("url").parse;

var adapter = module.exports;
adapter.initialize = function(compose) {

    DEBUG = compose.config.debug;

    adapter.connect = function(handler, connectionSuccess, connectionFail) {
        connectionSuccess();
    };
    adapter.disconnect = function() {};

    /*
     * @param {RequestHandler} handler
     */
    adapter.request = function(handler) {

        var params = parseUrl(compose.config.url + handler.path);
        params.headers = {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
            "Authorization": compose.config.apiKey
        };

        params.method = handler.method;

        if(DEBUG) {
            d("[node client] Preparing request");
            d('Params:');
            d(JSON.stringify(params));
        }

        var req = http.request(params, function(res) {

            var data = '';
            res.on('data', function(chunk) {
                data += chunk;
            });

            res.on('end', function() {
                d("[node client] Completed request, status code " + res.statusCode);
                if(res.statusCode >= 400) {
                    handler.emitter.trigger('error', data ? data : {
                        code: res.statusCode
                    });
                }
                else {
                    handler.emitter.trigger('success', data);
                }
            });

        });

        req.on('error', function(e) {
            d("[node client] Request error");
            handler.emitter.trigger('error', e);
        });

        if(handler.body) {
            var body = handler.body;
            if(typeof body !== 'string') {
                body = JSON.stringify(body);
            }

            d("[node client] Req. body " + body);
            req.write(body);
        }

        req.end();
        d("[node client] Sent request");

    };
};
