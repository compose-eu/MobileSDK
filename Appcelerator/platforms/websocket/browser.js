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

    var client = null;
    var reconnectTimes = 5;
    var tries = reconnectTimes;

    var DEBUG = false;
    var d = function(m) { (DEBUG === true || (DEBUG > 19)) && console.log(m); };

    var parseUrl = function(href) {

        var parser = document.createElement('a');
        parser.href = href;

        var o = {
            protocol: null,
            hostname: null,
            port: null,
            pathname: null,
            search: null,
            hash: null,
            host: null
        };

        for(var i in o) {
            if(parser[i]) {
                o[i] = parser[i];
            }
        }

        o.path = o.pathname;
        o.host = o.hostname;

        parser = null;
        return o;
    };


    var wslib = {};
    wslib.initialize = function(compose) {

        DEBUG = compose.config.debug;

        var queue = this.queue;

        compose.config.websocket = compose.config.websocket || {};
        var wsConf = {
            proto: compose.config.websocket.secure ? 'wss' : 'ws',
            host: compose.config.websocket.url || "api.servioticy.com",
            port: compose.config.websocket.port || "8081",
        };

        var request = {
            meta: {
                authorization: compose.config.apiKey
            },
            body: {}
        };

        wslib.connect = function(handler, connectionSuccess, connectionFail) {

            // initialize the client, but only if not connected or reconnecting
            // 0 not yet connected
            // 1 connected
            // 2 closing
            // 3 closed

            var needConnection = function() {

                if(client) {

                    d("WS state " + client.readyState);
                    switch(client.readyState) {
                        case 0:

                            d("[ws client] WS is connecting");
                            setTimeout(function() {
                                wslib.connect(handler, connectionSuccess, connectionFail);
                            }, 100);

                            return null;

                            break;
                        case 1:

                            d("[ws client] WS is already connected");
                            return false;

                            break;
                        case 2:
                        case 3:

                            d("[ws client] WS is closed or closing");
                            client = null;

                            break;
                    }
                }

                return true;
            };

            var needConn = needConnection();

            if(needConn === null) {
                return;
            }

            if (needConn) {

                d("[ws client] Connecting to ws server " +
                        wsConf.proto +'://'+ wsConf.host + ':' + wsConf.port + '/' + compose.config.apiKey);

                client = new WebSocket(wsConf.proto +'://'+ wsConf.host + ':' + wsConf.port + '/' + compose.config.apiKey);

                client.onclose = function() {
                    d("[ws client] Connection closed");
                    handler.emitter.trigger('close', client);
                };

                client.onerror = function(e) {
                    console.warn(e);
                    // @TODO: test properly the reconnection beahvior!
                    if(client) {

                        if(client.readyState >= 2 && tries < reconnectTimes){
                            d("[ws client] Connection lost, try reconnect");
                            tries--;
                            wslib.connect(handler, connectionSuccess, connectionFail);
                            return;
                        }

                        if(client.readyState < 2) {
                            d(e);
                            handler.emitter.trigger("error", { message: "Websocket error", data: e })
                            return;
                        }
                    }

                    d("[ws client] Connection error");
                    tries = reconnectTimes;
                    connectionFail(new Error("WebSocket connection error"));
                };

                client.onopen = function() {

                    tries = reconnectTimes;

                    d("[ws client] Connected");
                    handler.emitter.trigger('connect', client);

                    client.onmessage = function(message, flags) {
                        d("[ws client] New message received");
                        queue.handleResponse(message.data, message);
                    };

                    // return promise
                    connectionSuccess();

                };
            }
            else {
                // already connected
                connectionSuccess();
            }
        };

        wslib.disconnect = function() {
            client.close();
        };

        /*
         * @param {RequestHandler} handler
         */
        wslib.request = function(handler) {

            request.meta.method = handler.method;
            request.meta.url = handler.path;

            d("[ws client ] requesting " + request.meta.method + " " + request.meta.url);

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
            client.send(JSON.stringify(request));

        };
    };


    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = wslib;
    }
    else {
        if (typeof define === 'function' && define.amd) {
            define(['compose'], function(compose) {
                return wslib;
            });
        }
        else {
            window.__$platforms_websocket_browser = wslib;
        }
    }

})();