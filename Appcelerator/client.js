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

    var DEBUG = false;

    var d = function(m) {
        (DEBUG === true || DEBUG > 20) && console.log(m);
    };

    var client = {};
    client.setup = function(compose) {

        var ComposeError = compose.error.ComposeError;
        var guid = function() {
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
            }
            return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
        };

        if(!compose) {
            throw new ComposeError("compose.io module reference not provided, quitting..");
        }

        DEBUG = compose.config.debug;

        var httpErrors = {
          400: 'Bad Request',
          401: 'Unauthorized',
          402: 'Payment Required',
          403: 'Forbidden',
          404: 'Not Found',
          405: 'Method Not Allowed',
          406: 'Not Acceptable',
          407: 'Proxy Authentication Required',
          408: 'Request Time-out',
          409: 'Conflict',
          410: 'Gone',
          411: 'Length Required',
          412: 'Precondition Failed',
          413: 'Request Entity Too Large',
          414: 'Request-URI Too Large',
          415: 'Unsupported Media Type',
          416: 'Requested range not satisfiable',
          417: 'Expectation Failed',
          500: 'Internal Server Error',
          501: 'Not Implemented',
          502: 'Bad Gateway',
          503: 'Service Unavailable',
          504: 'Gateway Time-out',
          505: 'HTTP Version not supported'
        };

        var QueueManager = function(timeout) {

            // 5 seconds
            var timeout = timeout || 5000;

            // queue[ ttl ] = { created: xxx, callback: xxx }
            var queue = {};
            var queueSize = 0;
            var timer;

            var clearQueue = function() {
                if(!timer && queueSize > 0) {
                    d("[queue manager] timer started");
                    timer = setInterval(function() {

                        if(queueSize === 0) {
                            d("[queue manager] timer cleared");
                            clearInterval(timer);
                            return;
                        }

                        for(var i in queue) {
                            if((queue[i].created + timeout) > (new Date).getTime()) {
                                d("[queue manager] Pruning " + i);
                                queue[i].handler.emitter.trigger('error', { code: 408 });
                                queueSize > 0 && queueSize--;
                                delete queue[i];
                            }
                        }

                    }, timeout);
                }
                return timer;
            };

            this.guid = guid;

            this.add = function(obj) {

                if(typeof obj === 'function') {
                    obj = { created: (new Date).getTime(), handler: obj };
                }

                var uuid = this.guid();
                queue[uuid] = obj;

                queueSize++;
                clearQueue();

                d("[queue manager] Enqueued " + uuid);
                return uuid;
            };

            this.get = function(uuid) {
                clearQueue();
                return queue[uuid] ? queue[uuid] : null;
            };

            this.remove = function(uuid) {
                if(queue[uuid]) {
                    delete queue[uuid];
                    queueSize > 0 && queueSize--;
                }
                clearQueue();
            };

            this.clear = function() {
                for(var i in queue) delete queue[i];
                queueSize = 0;
                clearInterval(timer);
            };

            this.isErrorResponse = function(body) {
                return (body && body.status >= 400);
            };

            this.triggerAll = function(event) {
                for(var i in queue) {
                    var emitter = queue[i].emitter;
                    var a = [];
                    for(var i in arguments) a[i] = arguments[i];
                    a.push(queue[i]);
                    emitter.trigger.apply(emitter, a);
                }
            };

            this.handleResponse = function(message) {

                var response;
                try {
                    response = JSON.parse(message.data);
                }
                catch (e) {
                    console.error("Error reading JSON response");
                    console.error(e);
                    response = null;
                }

                // uhu?!
                if(!response) {
                    console.log("[queue manager] Message is empty.. skipping");
                    d(response);
                    return;
                }

                var errorResponse = this.isErrorResponse(response.body);
                if(response.messageId) {

                    var handler = this.get(response.messageId);
                    if(handler) {
                        if(errorResponse) {
                            handler.emitter.trigger('error', response.body);
                        }
                        else {
                            handler.emitter.trigger('success', response.body);
                        }

                        d("[queue manager] Message found, id " + response.messageId);

                        delete response.messageId;
                        return true;
                    }

                }

                d("[queue manager] Message not found, id " + ((response.messageId) ? response.messageId : '[not set]'));
                this.triggerAll('data', response, message);

                return false;
            };

        };


        var Emitter = function() {
            this.callbacks = {};
        };

        Emitter.prototype.on = function(event, callback) {

            if(!this.callbacks[event]) {
                this.callbacks[event] = [];
            }

            this.callbacks[event].push(callback);
        };

        Emitter.prototype.once = function(event, callback) {
            var me = this;
            var callback2;
            callback2 = function() {
                me.off(event, callback2);
                callback.apply(me, arguments);
            };

            this.on(event, callback2);
        };

        Emitter.prototype.off = function(event, callback) {
            callback = callback || null;

            if(!this.callbacks[event]) {
                return;
            }

            if(!callback) {
                this.callbacks[event] = [];
            }
            else {
                for(var i in this.callbacks[event]) {
                    if(this.callbacks[event][i] === callback) {
                        delete this.callbacks[event][i];
                        this.callbacks[event].splice(i, 1);
                    }
                }
            }
        };

        Emitter.prototype.trigger = function(event) {
            if(this.callbacks[event]) {

                var a = [];
                for(var i in arguments) {
                    a[i] = arguments[i];
                }
                a.shift();

                for(var i in this.callbacks[event]) {
                    this.callbacks[event][i].apply(this, a);
                }
            }
        };

        var RequestHandler = function(emitter) {
            this.emitter = emitter;
        };

        RequestHandler.prototype.setConf = function(conf) {
            for(var i in conf) {
                this[i] = conf[i];
            }
        };

        RequestHandler.prototype.parseError = function(error) {

            var errorObject = function(message, data, code) {

                if(code && !message) {
                    message = httpErrors[code];
                }

                return {
                    message: message || "Unknown error",
                    code: code || null,
                    data: data || {}
                };
            };

            if(error && error.message) {
                error = errorObject(error.message, error.data, error.code);
            }
            else {
                if(typeof error === 'string') {
                    try {
                        var json = JSON.parse(error);
                        error = errorObject(json.message, json.info, json.status);
                    }
                    catch(jsonError) {
                        error = errorObject("An error occured", error);
                    }
                }
            }

            return error;
        };

        RequestHandler.prototype.parseSuccess = function(body) {

            var data = body;

            if(!data) {
                return null;
            }

            if(typeof body === 'string') {
                try {
                    var data = JSON.parse(body);
                }
                catch (e) {
                    console.log("Error parsing JSON", e);
                    data = null;
                }
            }
            return data;
        };

        /**
         * The base library client interface
         *
         * @constructor
         */

        var queueManager = new QueueManager();

        var Client = function(emitter) {

            var adapter;
            this.adapter = function() {
                if(!adapter) {
                    adapter = compose.util.requireModule(null, compose.util.getAdapterPath());
                }
                return adapter;
            };

            this.queue = queueManager;

            this.requestHandler = new RequestHandler(emitter);
            this.initialize();
        };

        Client.prototype.initialize = function() {
            this.adapter().initialize && this.adapter().initialize.call(this, compose);
        };

        Client.prototype.connect = function() {
            var me = this;
            return new compose.lib.Promise(function(success, failure) {
                me.adapter().connect(me.requestHandler, success, failure);
            });
        };

        Client.prototype.disconnect = function() {
            if(this.adapter().disconnect){
                return this.adapter().disconnect(this.requestHandler);
            }
            return false;
        };

        Client.prototype.request = function(method, path, body, success, error) {

            var me = this;

            this.requestHandler.setConf({
                method: method,
                path: path,
                body: body
            });

            d("[client] Requesting " + this.requestHandler.method + " " + this.requestHandler.path);

            success && this.requestHandler.emitter.once('success', success);
            error && this.requestHandler.emitter.once('error', error);

            this.connect()
                .then(function() {
                    me.adapter().request(me.requestHandler);
                })
                .catch(function(err) {
                    d("Connection error");
                    d(err);
                    throw new compose.error.ComposeError(err);
                });
        };

        Client.prototype.post = function(path, data, success, error) {
            return this.request('post', path, data, success, error);
        };

        Client.prototype.get = function(path, data, success, error) {
            return this.request('get', path, data, success, error);
        };

        Client.prototype.put = function(path, data, success, error) {
            return this.request('put', path, data, success, error);
        };

        Client.prototype.delete = function(path, data, success, error) {
            return this.request('delete', path, data, success, error);
        };

        client.Client = Client;
        client.RequestHandler = RequestHandler;
        client.Emitter = Emitter;

    };

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = client;
    }
    else {
        if (typeof define === 'function' && define.amd) {
            define(['compose'], function(compose) {
                return client;
            });
        }
        else {
            window.__$client = client;
        }
    }

})();