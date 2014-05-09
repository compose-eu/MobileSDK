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
DEBUG = true;
var d = function(m) { DEBUG && console.log(m); };

var adapter = module.exports;
adapter.initialize = function(compose) {

    DEBUG = compose.config.debug;

    adapter.connect = function(handler, connectionSuccess, connectionFail) {
        d("[titanium client] connect..");
        connectionSuccess();
    };
    adapter.disconnect = function() {};

    /*
     * @param {RequestHandler} handler
     */
    adapter.request = function(handler) {

        var params = {};
        params.timeout = handler.timeout || 6000;

        params.onload = function(ev) {

            var status = this.status;
            var data = this.responseText;

            d("[titanium client] Response received " + status);

            try {
                data = JSON.parse(data);
            }
            catch (e) {
                status = 500;
                data = {
                    message: "Response from server is not readable"
                };
            }

            if(status >= 400) {
                handler.emitter.trigger('error', data ? data : {
                    code: status
                });
            }
            else {
                handler.emitter.trigger('success', data);
            }
        };

        params.onerror = function(e) {
            handler.emitter.trigger('error', e);
        };

        if(DEBUG){
            d("[titanium client] Preparing request");
            d('Params:');
            d(JSON.stringify(params));
        }

        var http = Titanium.Network.createHTTPClient(params);

        http.open(handler.method, compose.config.url + handler.path);

        http.setRequestHeader('Content-Type', 'application/json');
        http.setRequestHeader('Authorization', compose.config.apiKey);

        var body = null
        if(handler.body) {
            if(typeof handler.body !== "string") {
                body = JSON.stringify(handler.body);
            }
            else {
                body = handler.body;
            }
        }

        http.send(body);

    };
};
