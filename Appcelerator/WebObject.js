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

    var wolib = {};
    wolib.setup = function(compose) {

        var ComposeError = compose.error.ComposeError;
        var copyVal = compose.util.copyVal;

        if(!compose) {
            throw new ComposeError("compose.io module reference not provided, quitting..");
        }

        /**
         *
         * A list of Channel of a Stream
         *
         * @constructor
         * @augments ObjectList
         */
        var ChannelsList = function(channels) {
            compose.util.List.ObjectList.apply(this);
            this.initialize(channels);
        };
        compose.util.extend(ChannelsList, compose.util.List.ObjectList);

        ChannelsList.prototype.validate = function(channel) {

//            if(!channel.name) {
//                throw new ValidationError("Channel must have a `name` property");
//            }
//
//            if(!channel.type) {
//                throw new ValidationError("Channel must have a `type` property");
//            }
//
//            if(!channel.unit) {
//                throw new ValidationError("Channel must have a `unit` property");
//            }
//
//            if(channel.type !== 'Number' || channel.type !== 'String' || channel.type !== 'Boolean' ) {
//                throw new ValidationError("Channel `type` must be one of Number, String or Boolean");
//            }

            return channel;
        };


        /**
         *
         * A list of Stream objects of a WebObject
         *
         * @constructor
         * @augments ObjectList
         */
        var StreamList = function(streams) {

            compose.util.List.ObjectList.apply(this);

            if(this instanceof StreamList) {
                this.initialize(streams);
            }

        };
        compose.util.extend(StreamList, compose.util.List.ObjectList);

        StreamList.prototype.add = function(name, obj) {

            if (typeof name === "object") {
                for (var i in name) {
                    this.add(i, name[i]);
                }
                return this;
            }

            // handle arrays using the obj.name property
            if(obj.name && (typeof (parseFloat(name)) === 'number')) {
                name = obj.name;
            }

            if(!obj.name) {
                obj.name = name;
            }

            var stream = this.validate(obj);
            this.getList()[name] = stream;

            return stream;
        };

        /**
         * @param {String} name Identifier name
         * @return {Number} Return the index or -1 if not found
         */
        StreamList.prototype.getIndex = function(name, key) {

            var list = this.getList();

            if(list[name]) {
                return name;
            }

            key = key || 'name';
            var _size = this.size();
            for (var i = 0; i < _size; i++) {
                if (list[i][key] === name) {
                    return i;
                }
            }

            return -1;
        };

        StreamList.prototype.validate = function(stream) {

            var streamObj = new Stream(stream);
            streamObj.container(this.container());

            return streamObj;
        };

        /*
         *
         * @param {boolean} asString Return as string if true, object otherwise
         * @returns {Object|String}
         */
        StreamList.prototype.toJson = function(asString) {

            var list = this.getList();
            var json = copyVal(list);

            return asString ? JSON.stringify(json) : json;
        };

        StreamList.prototype.toString = function() {
            return this.toJson(true);
        };

        /**
         *
         * A Stream object
         *
         * @constructor
         */
        var Stream = function(obj) {
            if(this instanceof Stream) {
                this.initialize(obj);
            }
        };

        Stream.prototype.__$lastUpdate = null;
        Stream.prototype.__$container;

        Stream.prototype.container = function(o) {
            this.__$container = o || this.__$container;
            return this.__$container;
        };

        /**
         * Add a list of elements provided as argument to the stream
         * @param {Object} obj An object with the properties to set for the Stream
         */
        Stream.prototype.initialize = function(obj) {

            obj = obj || {};

            for (var i in obj) {
                if (!this[i]) {
                    this[i] = obj[i];
                }
            }

            this.channels = new ChannelsList(obj.channels || {});
            this.channels.container(this.container());

            this.setLastUpdate((new Date).getTime());
        };

        /**
         * Add or updates a channel. This function handles multiple arguments, eg.
         *
         * - addChannel(name, channel)
         * - addChannel(name, unit, type, value)
         *
         * @param {String} name Name of the channel
         * @param {String|Object} channel|unit Channel object (or unit value, when arguments count is >= 3)
         * @param {String} type Type of value
         * @param {String} value Current value of the channel
         *
         * @return {Stream} The current stream
         * */
        Stream.prototype.addChannel = function(name, channel, a3, a4) {

            if (arguments.length >= 3) {
                name = arguments[0];
                channel = {
                    "unit": arguments[1],
                    "type": arguments[2]
                };
                if (typeof arguments[3] !== "undefined") {
                    this.setValue(channel, arguments[3]);
                }
            }

            this.channels.add(name, channel);

            return this;
        };

        Stream.prototype.__$currentValue;
        Stream.prototype.__$lastUpdate = null;

        /**
         * Add or updates a list of channels
         *
         * @param {Object} channels List of channels
         *
         * @return {Stream} The current stream
         * */
        Stream.prototype.addChannels = function(channels) {
            this.channels.add(channels);
            return this;
        };

        /**
         * Set the value of a channel
         *
         * @param {String} name Channel name
         * @param {String} key Key of the channel to set
         * @param {mixed} value The value to set. If omitted, key will be used as current-value
         *
         * @return {Stream} The current stream
         */
        Stream.prototype.setChannel = function(name, key, value) {
            var channel = this.channels.get(name);
            if (channel) {

                // set value to alternative var
                //      or if 2 args only are provided
                if(key === 'current-value'
                        || typeof value === 'undefined') {
                    this.setValue(name, key);
                }
                else {
                    channel[key] = value;
                }

                this.channels.add(name, channel);
            }
            return this;
        };

        /*
         *
         * @param {Object} value Set the current value. If not set, the current value is emptyed. To add values for a single channel, use setValue
         * @see setValue
         *
         * @returns {Stream}
         */
        Stream.prototype.setCurrentValue = function(value) {
            this.__$currentValue = value ? value : { channels: {}, lastUpdate: null };
            return this;
        };
        /*
         *
         * @returns {Object} An object with the channels value
         */
        Stream.prototype.getCurrentValue = function() {
            if(!this.__$currentValue) {
                this.setCurrentValue();
            }
            return this.__$currentValue;
        };

        /**
         * Set value for a channel of the stream
         *
         * @param {String} name The channel name
         * @param {mixed} value The channel value
         *
         */
        Stream.prototype.setValue = function(name, value) {
            if(typeof name === "object") {
                for(var i in name) {
                    this.setValue(i, name[i]);
                }
            }
            else {

                var channel = this.channels.get(name);
                if (channel) {

                    if(!this.getCurrentValue()) {
                        this.setCurrentValue();
                    }

                    var currVal = this.getCurrentValue();
                    currVal.channels[name] = currVal.channels[name] || { 'current-value': null };
                    currVal.channels[name]['current-value'] = value;
                    currVal.lastUpdate = value.lastUpdate || this.__$lastUpdate;
                }
            }
            return this;
        };

        /**
         *
         * @return {Object} The values of the stream
         * */
        Stream.prototype.getValues = function() { return this.getCurrentValue.apply(this, arguments); };

        /**
         *
         * @argument {String} channel The channel name. If empty the whole stream object will be returned
         *
         * @return {mixed} A value  stored for a stream
         * */
        Stream.prototype.getValue = function(channel) {
            var values = this.getCurrentValue();
            if(channel) {
                if(values.channels && values.channels[channel]
                            && values.channels[channel]['current-value']) {  // lazy guy :P
                    return values.channels[channel]['current-value'];
                }
                return null;
            }
            return values;
        };

        /**
         * Set the value of a channel
         *
         * @param {mixed} value The value to set. If omitted, the current timestamp will be used.
         *                      If the value is in milliseconds (length is 13chars) it will be rounded to seconds.
         *
         * @return {Stream} The current stream
         */
        Stream.prototype.setLastUpdate = function(value) {
            value = value || (new Date).getTime();

            // convert from milliseconds to seconds
            if(value.toString().length === 13) {
                value = Math.round(value / 1000);
            }

            this.__$lastUpdate = value;
            this.getCurrentValue().lastUpdate = this.__$lastUpdate;
            return this;
        };

        /**
         * @param {String} name The channel name
         * @return {Object} The requested channel or null if not available
         */
        Stream.prototype.getChannel = function(name) {
            return this.channels.get(name);
        };

        /*
         *
         * @param {boolean} asString Return as string if true, object otherwise
         * @returns {Object|String}
         */
        Stream.prototype.toJson = function(asString) {

            var json = {};

            copyVal(this, json);
            json.channels = this.channels.toJson();

            return asString ? JSON.stringify(json) : json;
        };

        Stream.prototype.toString = function() {
            return this.toJson(true);
        };

        /**
         * Creates a WebObject instance
         */
        var WebObject = function(objdef) {

            var me = this;

            this.properties = [];
            this.customFields = {};

            if(this instanceof WebObject) {
                this.initialize(objdef);
            }
        };

        WebObject.prototype.__$streams = null;
        WebObject.prototype.__$actions = null;

        /**
         * Take an object and set the fields defining the WO accordingly
         * This method will overwrite any previous information
         *
         * Minimum information required are
         * `{ properties: { name: "<wo name>", id: "<wo id>" } }`
         *
         * @param {Object} obj An object with the definition of the WO.
         * @return {WebObject} A webobject instace
         */
        WebObject.prototype.initialize = function(obj) {

            obj = obj || {};

            for (var i in obj) {
                if (typeof obj[i] !== 'function') {
                    this[i] = obj[i];
                }
            }

            this.customFields = obj.customFields || {};
            this.properties = obj.properties || [];

            this.setStreams(copyVal(obj.streams || {}));
            this.setActions(copyVal(obj.actions || {}));

            return this;
        };

        WebObject.prototype.getStreams = function() {
            return this.__$streams;
        };

        /**
         *
         */
        WebObject.prototype.setStreams = function(streams) {
            var _streams = new StreamList(streams);
            _streams.container(this);
            this.__$streams = _streams;
        };

        /**
         *
         * @param {String} name The stream name
         * @return {Object} The Streamobject
         */
        WebObject.prototype.getStream = function(name) {
            return this.getStreams().get(name);
        };


        WebObject.prototype.getActions = function() {
            return this.__$actions;
        };

        /**
         *
         * @param {Object} actions
         * @returns {WebObject} self reference
         */
        WebObject.prototype.setActions = function(actions) {

            var _actions = this.getActions();
            _actions = new compose.util.List.ArrayList(actions);
            _actions.container(this);

            return this;
        };

        /**
         * @param {String} name The action name
         * @return {Object} The Action object
         */
        WebObject.prototype.getAction = function(name) {
            return this.getActions().get(name);
        };

        /**
         * @param {Object} key The object name
         * @param {Object} stream The object with stream data
         *
         * @return {Object} The Stream object
         */
        WebObject.prototype.addStream = function(key, stream) {
            return this.getStreams().add(key, stream);
        };

        /**
         * @param {Array} streams List of objects to add
         * @return {WebObject} The WO object
         */
        WebObject.prototype.addStreams = function(streams) {
            if (typeof streams === "object") {
                for (var i in streams) {
                    this.addStream((typeof parseFloat(i) === 'number') ? streams[i].name : i, streams[i]);
                }
            }
            return this;
        };

        /**
         * @param {Object} action The object to add
         * @return {Object} The Action object
         */
        WebObject.prototype.addAction = function(action) {
            return this.getActions().add(action);
        };

        /**
         * @param {Array} actions List of objects to add
         * @return {WebObject} The WO object
         */
        WebObject.prototype.addActions = function(actions) {
            if (actions instanceof Array) {
                for (var i = 0; i < actions.length; i++) {
                    this.getActions().add(actions[i]);
                }
            }
            return this;
        };

        /**
         * Set a channel value
         *
         * @param {String} stream The name of the stream
         * @param {String} channel The name of the channel
         * @param {String} key The key of the channel to set
         * @param {mixed} value The value of the channel
         *
         * @return {WebObject} Object self reference
         */
        WebObject.prototype.setChannel = function(stream, channel, key, value) {
            var stream = this.getStream(stream);
            if(stream) {
                stream.setChannel(channel, key, value);
            }
            return this;
        };

        /**
         * Set a channel value
         *
         * @param {String} stream The name of the stream or an object with stream name as key
         *                        and object with channel name as key and their values.
         *                        eg { streamName: { channelName1: value, channelName2: value } }
         * @param {String} channel The name of the channel or and object with channel name as key and its value
         *                        eg { channelName1: value, channelName2: value }
         * @param {mixed} value The value of the channel
         *
         * @return {WebObject} Object self reference
         */
        WebObject.prototype.setValue = function(stream, channel, value) {
            if(typeof stream === 'object') {
                for(var i in stream) {
                    this.setValue.apply(this, [i, stream[i]]);
                }
            }
            else {
                var stream = this.getStream(stream);
                if(stream) {
                    stream.setValue(channel, value);
                }
            }
            return this;
        };

        /**
         * Get a channel value
         *
         * @param {String} stream The name of the stream
         * @param {String} channel The name of the channel
         *
         * @return {mixed} The value of a channel or null if not set
         */
        WebObject.prototype.getValue = function(stream, channel) {
            var stream = this.getStream(stream);
            if(stream) {
                return  stream.getValue(channel);
            }
            return this;
        };

        /*
         *
         * @param {boolean} asString Return as string if true, object otherwise
         * @returns {Object|String}
         */
        WebObject.prototype.toJson = function(asString) {
            var json = {};

            for (var i in this) {
                if (typeof this[i] !== 'function' && i.substr(0, 3) !== '__$') {
                    if(this[i] !== null) {
                        json[i] = this[i];
                    }
                }
            }

            var streams = this.getStreams();
            json.streams = streams ? streams.toJson() : {};

            var actions = this.getActions();
            json.actions = actions ? actions.toJson() : [];

            return asString ? JSON.stringify(json, null) : json;
        };

        WebObject.prototype.toString = function() {
            return this.toJson(true);
        };

        /**
         * StreamList class
         */
        wolib.StreamList = StreamList;

        /**
         * Stream class
         */
        wolib.Stream = Stream;

        /**
         * WebObject class
         */
        wolib.WebObject = WebObject;

        /**
         * Creates a new instance of a WebObject
         *
         * @param {Object} wo An object with WebObject properties
         */
        wolib.create = function(wo) {
            return new WebObject(wo || {});
        };

    //    // read a json file by name @todo need to be ported and adapted
    //    wolib.read = function(name) {
    //        var platform = getPlatformImpl();
    //        var content = platform.readFile(name, { definitionsPath: getDefinitionPath() });
    //        return content ? JSON.parse(content) : {};
    //    };

    };

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = wolib;
    }
    else {
        if (typeof define === 'function' && define.amd) {
            define(['compose', 'utils/List'], function(compose) {
                return wolib;
            });
        }
        else {
            window.__$WebObject = wolib;
        }
    }

})();