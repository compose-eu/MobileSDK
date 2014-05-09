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

var client = require('net.iamyellow.tiws').createWS();
var isConnected = false;

var adapter = module.exports;
adapter.initialize = function(compose) {

    DEBUG = compose.config.debug;

    var queue = this.queue;

    compose.config.websocket = compose.config.websocket || {};
    var wsConf = {
        proto: compose.config.websocket.secure ? 'wss' : 'ws',
        host: compose.config.websocket.host || "api.servioticy.com",
        port: compose.config.websocket.port || "8081",
    };

    var request = {
        meta: {
            authorization: compose.config.apiKey
        },
        body: {}
    };

    adapter.connect = function(handler, connectionSuccess, connectionFail) {

        d("Connection requested");

        // initialize the client, but only if not connected or reconnecting
        if (!client ||
            (client && !isConnected)) {

            d("[ti.ws client] Connecting to ws server " +
                    wsConf.proto +'://'+ wsConf.host + ':' + wsConf.port + '/' + compose.config.apiKey);

            client.addEventListener('close', function() {
                isConnected = false;
                d("[ti.ws client] Connection closed");
                handler.emitter.trigger('close', client);
            });

            client.addEventListener('error', function(e) {
                isConnected = false;
                d("[ti.ws client] Connection error");
                console.error(e);

                connectionFail(e);
            });

            client.addEventListener('open', function() {

                isConnected = true;

                d("[ti.ws client] Connected");
                handler.emitter.trigger('connect', client);

                client.addEventListener('message', function(message, flags) {

                    d("[ti.ws client] New message received");
//                    console.log(message.data);
                    queue.handleResponse(message.data, message);

                });

                // return promise
                connectionSuccess();
            });

            client.open(wsConf.proto +'://'+ wsConf.host + ':' + wsConf.port + '/' + compose.config.apiKey);

        }
        else {
            // already connected
            connectionSuccess();
        }
    };

    adapter.disconnect = function() {
        isConnected = false;
        client.close();
    };

    /*
     * @param {RequestHandler} handler
     */
    adapter.request = function(handler) {

        request.meta.method = handler.method;
        // access with [url] to avoid tishadow rewrite of url
        request.meta['url'] = handler.path;

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

        d("[ti.ws client] Sending message..");
        var m = JSON.stringify(request);
//        d(m);
        client.send(m);

    };
};

