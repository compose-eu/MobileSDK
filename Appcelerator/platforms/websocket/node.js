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


var d = function(m) {
    DEBUG && console.log(m);
};

var WebSocket = require('ws');
var parseUrl = require("url").parse;

var client;

var adapter = module.exports;
adapter.initialize = function(compose) {

    DEBUG = compose.config.debug;
    var queue = this.queue;

    compose.config.websocket = compose.config.websocket || {};

    var host = compose.config.websocket.host;
    if (!host && compose.config.url) {
        var urlinfo = parseUrl(compose.config.url);
        host = urlinfo.hostname;
    }

    var wsConf = {
        proto: compose.config.websocket.secure ? 'wss' : 'ws',
        host: host || "api.servioticy.com",
        port: compose.config.websocket.port || "8081"
    };

    var request = {
        meta: {
            authorization: compose.config.apiKey
        },
        body: {}
    };


    adapter.connect = function(handler, connectionSuccess, connectionFail) {

        d("Connection requested");

        var needConnection = function() {

            if(client) {

    //            d("[ws client] WS state " + client.readyState);
                switch(client.readyState) {
                    case client.CONNECTING:

                        d("[ws client] WS is connecting");
                        setTimeout(function() {
                            wslib.connect(handler, connectionSuccess, connectionFail);
                        }, 100);

                        return false;

                        break;
                    case client.OPEN:

                        d("[ws client] WS is already connected");
                        return false;

                        break;
                    case client.CLOSING:
                    case client.CLOSED:

                        d("[ws client] WS is closed or closing");
                        client = null;

                        break;
                }
            }

            return true;
        };

        // initialize the client, but only if not connected or reconnecting
        if (needConnection()) {

            d("[ws client] Connecting to ws server " +
                    wsConf.proto +'://'+ wsConf.host + ':' + wsConf.port + '/' + compose.config.apiKey);

            client = new WebSocket(wsConf.proto +'://'+ wsConf.host + ':' + wsConf.port + '/' + compose.config.apiKey);

            client.on('close', function() {
                d("[ws client] Connection closed");
                handler.emitter.trigger('close', client);
            });

            client.on('error', function(e) {

                d("[ws client] Connection error");
                d(e);

                connectionFail(e);
            });

            client.on('open', function() {

                d("[ws client] Connected");
                handler.emitter.trigger('connect', client);

                client.on('message', function(message, flags) {
                    d("[ws client] New message received");
                    queue.handleResponse(message);

                });

                // return promise
                connectionSuccess();

            });
        }
        else {
            // already connected
            connectionSuccess();
        }
    };

    adapter.disconnect = function() {
        client.close();
    };

    /*
     * @param {RequestHandler} handler
     */
    adapter.request = function(handler) {


        request.meta.method = handler.method;
        request.meta.url = handler.path;

        if (handler.body) {
            var body = handler.body;
            if (typeof body === "string") {
                body = JSON.parse(body);
            }
            request.body = body;
        }
        else {
            delete request.body;
        }

        request.messageId = queue.add(handler);

        d("[ws client] Sending message..");
        client.send(JSON.stringify(request), function(error) {

            if(error) {
                handler.emitter.trigger('error', error);
                return;
            }

            d("[ws client] Message published");
        });

    };
};

