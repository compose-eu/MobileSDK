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
(function(){

    var DEBUG = false;
    var d = function(m) { DEBUG === true || DEBUG > 10 && console.log(m); };

    var solib = {};
    solib.setup = function(compose) {

        var ComposeError = compose.error.ComposeError;
        var Promise = compose.lib.Promise;

        var Subscription = function() {

            if(this instanceof Subscription) {
                var args = arguments[0] ? arguments[0] : {};
                this.initialize(arguments);
            }

        };

        Subscription.prototype.__$container;

        Subscription.prototype.container = function(o) {
            this.__$container = o || this.__$container;
            return this.__$container;
        };

        Subscription.prototype.initialize = function(object) {
            for(var i in object) {
                this[i] = object[i];
            }
        };

        /**
         * Create a ServiceObject subscription
         *
         * @return {Promise} Promise callback with result
         */
        Subscription.prototype.create = function() {
            var me = this;
            return new Promise(function(resolve, reject) {

                var url = '/'+me.container().id+'/streams/'+ me.name
                                +'/subscriptions'+ (me.id ? '/'+me.id : '');

                me.container().getClient().post(url, me.toJson(), function(data) {

                    me.id = data.id;
                    me.created = data.id;

                    resolve && resolve(me);

                }, reject);
            });
        };

        /**
         * Update a ServiceObject subscription
         *
         * @param {String} subscriptionId The subscription Id instance
         *
         * @return {Promise} Promise callback with result
         */
        Subscription.prototype.update = function() {
            var me = this;
            return new Promise(function(resolve, reject) {

                if(!subscription.id) {
                    throw new ComposeError("Subscription must have an id");
                }

                var url = '/'+me.container().id+'/streams/'+ me.name +'/subscriptions/'+ me.id;
                me.getClient().put(url, me.toJson(), function(data) {

                    resolve(data);
                }, reject);
            });
        };

        /**
         * Delete a ServiceObject subscription
         *
         * @param {String} subscriptionId The subscription Id instance
         *
         * @return {Promise} Promise callback with result
         */
        Subscription.prototype.delete = function() {
            var me = this;
            return new Promise(function(resolve, reject) {

                if(!this.id) {
                    throw new ComposeError("Subscription must have an id");
                }

                var url = '/'+me.container().id+'/streams/'+ me.name
                                +'/subscriptions/'+ me.id;

                me.container().getClient().delete(url, null, resolve, reject);
            });
        };

        /**
         *
         * List of Subscriptions
         *
         * @constructor
         * @augments WebObject.StreamList
         */
        var SubscriptionList = function() {
            compose.util.List.ArrayList.apply(this, arguments);
        };
        compose.util.extend(SubscriptionList, compose.util.List.ArrayList);

        SubscriptionList.prototype.validate = function(obj) {
            var sub = new Subscription(obj);
            sub.container(this.container());
            return sub;
        };

        /**
         * Load all the ServiceObject subscriptions
         *
         * @return {Promise} Promise callback with result
         */
        SubscriptionList.prototype.refresh = function() {
            var me = this;
            return new Promise(function(resolve, reject) {
                var url = '/'+me.container().id+'/streams/'+ me.name +'/subscriptions/';
                me.container().getClient().get(url, null, function(data) {
                    me.setSubscriptions(data.subscriptions);
                    resolve(data.subscriptions);
                }, reject).bind(me.container());
            });
        };

        /**
         *
         * A Stream object
         *
         * @constructor
         * @augments WebObject.Stream
         */
        var Stream = function(obj) {
            compose.lib.WebObject.Stream.apply(this, arguments);
            this.initialize(obj);
        };
        compose.util.extend(Stream, compose.lib.WebObject.Stream);

        Stream.prototype.__$subscriptions;

        Stream.prototype.initialize = function(obj) {

            obj = obj || {};

            this.__$parent.initialize.call(this, obj);

            this.__$subscriptions = new SubscriptionList(obj.subscriptions || {});
            this.__$subscriptions.container(this.container());

            return this;
        };

        Stream.prototype.getSubscriptions = function() {
            return this.__$subscriptions;
        };

        Stream.prototype.setSubscriptions = function(list) {
            for(var i in list) {
                this.getSubscriptions().add(list[i]);
            }
            return this;
        };

        /**
         * Get a subscriptions by id
         *
         * @param {mixed} value The id value
         * @param {mixed} value The key of the subscription object to match with `value`
         *
         * @return {Subscription} A subscription if found
         */
        Stream.prototype.getSubscription = function(value, key) {
            key = key || 'id';
            return this.getSubscriptions().get(value, key);
        };

        /**
         * Add a subscriptions
         *
         * @param {mixed} object An object with the Subscription properties
         *
         * @return {Subscription} A subscription object
         */
        Stream.prototype.addSubscription = function(object) {
            object = object || {};
            return this.getSubscriptions().add(object);
        };

        /**
         * Store the data of the ServiceObject stream
         *
         * @return {Promise} Promise callback with result
         */
        Stream.prototype.push = function(data, lastUpdate) {
            var me = this;
            return new Promise(function(resolve, reject) {

                if(!me.container().id) {
                    throw new ComposeError("Missing ServiceObject id.");
                }

                if(data) {
                    me.setValue(data);
                    lastUpdate = lastUpdate || (new Date).getTime();
                    me.setLastUpdate(lastUpdate);
                }

                var url = '/' + me.container().id + '/streams/' + me.name;
                me.container().getClient().put(url, me.getCurrentValue(), function(data) {

                    // reset the current value on success (no params)
                    me.setCurrentValue();

                    resolve && resolve(data);

                }, reject);

            });
        };


        /**
         * Retieve the description of the ServiceObject streams
         *
         * @param {String} timeModifier  text, optional Possible values: lastUpdate, 1199192940 (time ago as timestamp)
         * @return {Promise} Promise callback with result
         */
        Stream.prototype.pull = function(timeModifier) {

            var me = this;
            timeModifier = timeModifier ? timeModifier : "";

            return new Promise(function(resolve, reject) {

                if(!me.container().id) {
                    throw new ComposeError("Missing ServiceObject id.");
                }

                var url = '/' + me.container().id + '/streams/' + me.name + '/' + timeModifier;
                me.container().getClient().get(url, null, function(res) {

                    var data = [];
                    if(res && res.data) {
                        data = res.data;
                    }

                    var dl = data.length;
                    for(var i = 0; i < dl; i++) {
                        // utility getter
                        var d = data[i];
                        d.get = function(channel, defaultValue) {
                            defaultValue = (typeof defaultValue !== 'undefined') ? defaultValue : null;
                            return d && d.channels[channel] ? d.channels[channel]['current-value'] : defaultValue;
                        };
                    }

                    resolve && resolve(data);

                }, reject);
            });
        };

        /**
         *
         * List of Stream object
         *
         * @constructor
         * @augments WebObject.StreamList
         */
        var StreamList = function(obj) {
            compose.lib.WebObject.StreamList(this, arguments);
            this.initialize(obj);
        };
        compose.util.extend(StreamList, compose.lib.WebObject.StreamList);

        StreamList.prototype.validate = function(stream) {
            var streamObj = new Stream(stream);
            streamObj.container(this.container());
            return streamObj;
        };

        /**
         * Retieve the description of the ServiceObject streams
         *
         * @return {Promise} A promise with future result
         */
        StreamList.prototype.refresh = function() {
            var me = this;
            return new Promise(function(resolve, reject) {

                if(!me.container().id) {
                    throw new ComposeError("Missing ServiceObject id.");
                }

                me.container().getClient().get('/'+me.container().id+'/streams', null, function(data) {
                    if(data) {
                        for(var i in data.streams) {
                            var stream = data.streams[i];
                            me.container().getStreams().add(stream.name || i, stream);
                        }
                    }

                    resolve && resolve(me);

                }, reject);
            }).bind(me.container());
        };

        /**
         *
         * The Service Object
         *
         * @param {Object} An optional object with the SO definition
         * @constructor
         * @augments WebObject
         */
        var ServiceObject = function(objdef) {

            compose.WebObject.apply(this, arguments);

            this.id = null;
            this.createdAt = null;

            this.__$emitter = new compose.lib.Client.Emitter;

            this.initialize(objdef);
        };
        compose.util.extend(ServiceObject, compose.WebObject);

        ServiceObject.prototype.emitter = function() {
            return this.__$emitter;
        };

        ServiceObject.prototype.getClient = function() {
            return new compose.lib.Client.Client(this.emitter());
        };

        /*
         * @return {String} The service object id
         */
        ServiceObject.prototype.getId = function() {
            return this.id || null;
        };

        /*
         * @return {Number} The creation date as unix timestamp
         */
        ServiceObject.prototype.getCreatedAt = function() {
            return this.createdAt || null;
        };

        /**
         * Bind to an event
         *
         * @param {String} event The event name
         * @param {Function} callback Triggered when the event occur
         * @return {Stream} Self refrence to current stream
         */
        ServiceObject.prototype.on = function(event, callback) {
            this.emitter().on(event, callback);
            return this;
        };

        /**
         * Bind to an event, but trigger only one time
         *
         * @param {String} event The event name
         * @param {Function} callback Triggered when the event occur
         * @return {Stream} Self refrence to current stream
         */
        ServiceObject.prototype.once = function(event, callback) {
            this.emitter().once(event, callback);
            return this;
        };

        /**
         * Unbind to an event
         *
         * @param {String|Boolean} event The event name or true to remove all the callbacks
         * @param {Function} callback The function to remove
         * @return {Stream} Self refrence to current stream
         */
        ServiceObject.prototype.off = function(event, callback) {
            this.emitter().off(event, callback);
            return this;
        };

        /**
         * Trigger an event
         *
         * @param {String} event The event name
         * @params {mixed} additional arguments to pass to the event
         * @return {Stream} Self refrence to current stream
         */
        ServiceObject.prototype.trigger = function() {
            this.emitter().trigger.apply(this.emitter(), arguments);
            return this;
        };

        ServiceObject.prototype.setStreams = function(streams) {

            var _streams = new StreamList();
            _streams.container(this);
            _streams.initialize(streams);

            this.__$streams = _streams;
        };

        /**
         * Create a new ServiceObject definition and register it in the repository.
         * The unique ServiceObject id (soId) is returned on success.
         *
         * @return {ServiceObject} Self reference
         */
        ServiceObject.prototype.create = function() {
            var me = this;
            return new Promise(function(resolve, reject) {
                me.getClient().post('/', me.toJson(), function(data) {
                    if(data) {
                        // set internal reference to soId and createdAt
                        me.id = data.id;
                        me.createdAt = data.createdAt;
                    }
                    resolve && resolve(me, data);
                }, reject);
            })
            .bind(this)
            ;
        };

        /**
         * Get the ServiceObject description
         *
         * @param {Function} then Function to call after request is completed. eg. function(error, WebObject) {}
         * @param {String} soId A service object Id
         *
         * @return {ServiceObject} Self reference
         */
        ServiceObject.prototype.load = function(id) {
            var me = this;
            return new Promise(function(resolve, reject) {

                if(id) {
                    me.id = id;
                }

                if(!me.id) {
                    throw new ComposeError("Missing ServiceObject id.");
                }

                me.getClient().get('/'+me.id, null, function(data) {
                    if(data) {
                        me.initialize(data);
                    }
                    resolve && resolve(me);
                }, reject);
            }).bind(me);
        };

    //    /**
    //     * Update ServiceObject description
    //     *
    //     * @param {WebObject} wo A WebObject instance
    //     * @param {Function} then Function to call after request is completed. eg. function(error, WebObject) {}
    //     *
    //     * @return {ServiceObject} Self reference
    //     */
    //    ServiceObject.prototype.update = function(then) {
    //
    //        var me = this;
    //
    //        if(!me.id) {
    //            throw new Error("Missing ServiceObject id.");
    //        }
    //
    //        return getPromise(function(resolve, error) {
    //            me.getClient().put(['', me.id], me.toString(), function(data) {
    //                if(data) {
    //                    me.load(data);
    //                }
    //                resolve && resolve(data);
    //            }, error);
    //        });
    //    };


        /**
         * @todo: ACTUATIONS section
         */

    //    ServiceObject.prototype.toString = compose.WebObject.prototype.toString;

        solib.ServiceObject = ServiceObject;
        solib.create = function(wo) {

            if(wo instanceof compose.WebObject) {
                wo = wo.toJson();
            }

            return (new ServiceObject(wo)).create();
        };

        /**
         * @param {String} id ServiceObject id
         *
         * @return {Promise} A promise with the created SO
         */
        solib.load = function(id) {
            var so = new ServiceObject();
            return so.load(id);
        };

        /**
         * Retrieve all the Service Objects from a given user (identified by the Authorization header).
         *
         * @return {ServiceObject} Self reference
         */
        solib.list = function() {

            var emitter = new compose.lib.Client.Emitter;
            var client = new compose.lib.Client.Client(emitter);

            return new Promise(function(resolve, reject) {
                client.get('/', null, function(data) {

                    client = null;
                    emitter = null;

                    resolve(data);
                }, reject);
            }).bind(this);
        };

        /**
         * Return a API client instance
         *
         * @todo: move to a autonomous module?
         * @return {compose.lib.Client.Client} A compose client
         */
        solib.client = function() {
            return (new ServiceObject()).getClient();
        };

    };

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = solib;
    }
    else {
        if (typeof define === 'function' && define.amd) {
            define(['compose', 'WebObject', 'utils/List'], function(compose) {
                return solib;
            });
        }
        else {
            window.__$ServiceObject = solib;
        }
    }

})();