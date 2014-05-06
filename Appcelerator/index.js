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
"use strict";

(function(){

    var config = {};

    config.debug = false;

    var DEBUG = config.debug;
    var d = function(m) { (DEBUG === true || DEBUG > 5) && console.log(m); };

    config.modulePath = "./";
    config.platformsPath = "platforms/";
    config.vendorsPath = "vendors/";
    config.definitionsPath = "definitions/";

    config.url = "http://api.servioticy.com";
    config.apiKey = null;

    config.transport = null;

    var compose = {};

    var registerUrl = "http://www.servioticy.com/?page_id=73";

    // configurations
    compose.config = config;
    // utils
    compose.util = {};
    // modules referece
    compose.lib = {};
    // custom errors
    compose.error = {};

    compose.error.ComposeError = function(m) {

        if(typeof m === "string") {
            this.message = m;
        }
        
        if(m instanceof Error) {
            this.message = m.message;
            this.stack = m.stack;
            this.code = m.code;
            this.errno = m.errno;
        }
    };
    compose.error.ComposeError.prototype = new Error;

    compose.error.ValidationError = function(m) {
        this.message = m;
    };
    compose.error.ValidationError.prototype = new compose.error.ComposeError;

    /**
     * Sniff the current enviroment
     */
    compose.config.platform = (function() {

        var platforms = {
            browser: function() {
                return (typeof document !== 'undefined' && document.getElementById);
            },
            titanium: function() {
                return (typeof Titanium !== 'undefined' && Titanium.API);
            },
            node: function() {
                return (typeof process !== 'undefined' && process.exit);
            }
        };

        for(var type in platforms) {
            if(platforms[type]()) {
                return type;
            }
        }

        throw new compose.error.ComposeError("Enviroment not supported.");

    })();

    compose.util.getModulePath = function() {
        return config.modulePath;
    };

    compose.util.getPlatformPath = function() {
        return compose.util.getModulePath() + config.platformsPath;
    };

    compose.util.getVendorsPath = function() {
        return compose.util.getModulePath() + config.vendorsPath;
    };

    compose.util.getDefinitionsPath = function() {
        return compose.util.getModulePath() + config.definitionsPath;
    };

    compose.util.getPromiseLib = function() {

        var PromiseLib = null;

        if(compose.config.platform === 'titanium') {
            var lib = compose.util.getVendorsPath() + 'bluebird/titanium/bluebird';
            PromiseLib = require(lib);
        }
        else if(compose.config.platform === 'browser' && window.define === 'undefined') {
            PromiseLib = require(compose.util.getVendorsPath() + 'bluebird/browser/bluebird');
        }
        else {
            PromiseLib = require("bluebird");
        }

        if(!PromiseLib) {
            throw new Error("Cannot load Promise library, please check paths configuration for "
                                + compose.util.getVendorsPath());
        }

        return PromiseLib;
    };

    /**
     * @return {String} Return an adapter module path, placed in
     *                  [platform-path]/[transport]/[enviroment]
     */
    compose.util.getAdapterPath = function() {
        var path = compose.util.getPlatformPath() + compose.config.transport
                    + '/' + compose.config.platform;
        return path;
    };

    /**
     * Wrapper for standard require, to normalize paths on different enviroments
     *
     * @param {String} name
     * @param {String} path Optional, full path to module (substitute name)
     * @returns {Object} The required module
     */
    compose.util.requireModule = function(name, path) {
        path = path || compose.util.getModulePath() + name;
//        console.log("Requiring " + path);
        return require(path);
    };

    /*
     * Requires a module and call its `setup` module
     *
     * @param {type} name
     * @param {type} path
     * @returns {module}
     */
    compose.util.setupModule = function(name, path) {
        var module = compose.util.requireModule(name, path);
        module.setup && module.setup(compose);
        return module;
    };

    /**
     *  Extends an object by (shallow) copying its prototype and expose a
     *  `__$parent` property to Child to get access to parent
     *
     *  @memo In the child contructor remember to call `Parent.apply(this, arguments)`
     *
     *  @param {Object} Child The object to extend
     *  @param {Object} Parent The object to extend
     *
     */
    compose.util.extend = function(Child, Parent) {
        var p = Parent.prototype;
        var c = Child.prototype;
        for (var i in p) {
            c[i] = p[i];
        }
        c.__$parent = p;
        c.parent = function() { return c.__$parent; };
    };

    var setPaths = function() {
        if(compose.config.platform === 'titanium') {
            config.platformsPath = config.platformsPath;
        }
    };

    /*
     * Recursively copy an object to another skipping function, key with __$ prefix
     *
     * @param {Object,Array} src Source object
     * @param {Object,Array} dst Optional, destination object
     *
     * @returns {Object,Array}
     */
    compose.util.copyVal = function (src, dst) {

        var gettype = function(t) { return (t instanceof Array) ? [] : {}; };
        dst = dst || gettype(src);


        for (var i in src) {

            var v = src[i];

            if(i.substr(0, 3) === '__$') {
                continue;
            }

            if (typeof v === 'function') {
                continue;
            }

            if (v && v.toJson) {
                dst[i] = v.toJson();
                continue;
            }

            if (typeof v === 'object') {
                dst[i] = compose.util.copyVal(v);
                continue;
            }

            dst[i] = v;
        }
        return dst;
    };

    var setDebug = function(debug) {

        compose.config.debug = debug;

        if(compose.config.debug) {
            if(compose.config.platform !== 'titanium')
                compose.lib.Promise && compose.lib.Promise.longStackTraces();
        }

    };

    /**
     * Select the best supported transport mechanism for the current platform
     * */
    var selectPreferredTransport = function() {
        if(!compose.config.transport) {
            var p = "http";
            switch (compose.config.platform) {
                case "titanium":
                case "node":
                    p = "mqtt";
                    break;
                case "browser":
                    if(window.WebSocket) {
                        p = "websocket";
                    }
                    break;
            }
            compose.config.transport = p;
        }
        d("selected transport is " + compose.config.transport);
    };

    /**
     * Initialize the module. Available options are
     * {
     *  // api key
     *  apiKey: '<api key>',
     *  // endpoint url
     *  url: 'http://api.servioticy.com'
     *  // transport layer, supported list is [ http, mqtt, websocket ]
     *  transport: 'websocket'
     *  // custom module path eg `custom-path/compose.io/`
     *  modulePath: './'
     * }
     * @param {Object|String} _config An object with config options or only the apiKey
     *
     */
    var _initialized = false;
    compose.setup = function(_config) {

        if(_initialized && !_config.reinit) {
            return compose;
        }

        // titanium expects a path like Resources/[module]
        // adding custom path here, overridable by module.init(baseDir)
        var platform = compose.config.platform;
        if(platform === 'titanium') {
            compose.config.modulePath = 'compose.io/';
        }

        if(typeof _config === 'string') {
            _config= { apiKey: _config };
        }

        if(_config) {

            config.modulePath = _config.modulePath || config.modulePath;
            config.platformsPath = _config.platformsPath || config.platformsPath;

            if(_config.transport) {
                 config.transport = _config.transport;
                if(_config[config.transport]) {
                    config[config.transport] = _config[config.transport] || null;
                }
            }

            config.url = _config.url || config.url;
            config.apiKey = _config.apiKey;

            config.debug = _config.debug || config.debug;
            DEBUG = config.debug;
        }

        if(!config.apiKey) {
            throw new compose.error.ComposeError("An apiKey is required to use the platform, please visit " +
                    registerUrl + " for further instructions");
        }

        setPaths();
        selectPreferredTransport();

        setDebug(config.debug);

        compose.util.List = compose.util.setupModule("utils/List");

        compose.lib.Promise = compose.util.getPromiseLib();


        if(!compose) {
            throw new compose.error.ComposeError("compose.io module reference not provided, quitting..");
        }

        compose.lib.Client = compose.util.setupModule("client");

        // initialize & expose WebObject module
        compose.lib.WebObject = compose.util.setupModule("WebObject");
        compose.WebObject = compose.lib.WebObject.WebObject;


        // initialize & expose ServiceObject module
        compose.lib.ServiceObject = compose.util.setupModule("ServiceObject");
        compose.ServiceObject = compose.lib.ServiceObject.ServiceObject;

        compose.load = compose.lib.ServiceObject.load;
        compose.create = compose.lib.ServiceObject.create;
        compose.list = compose.lib.ServiceObject.list;

        compose.setDebug = setDebug;

        /**
         *
         * @param {String} model
         * @return {Promise<Function(Object)>} a promise wtih a future new service object based on model definition
         */
        compose.getDefinition = function(model) {
            var r = compose.util.setupModule("utils/DefinitionReader");
            return r.read(model);
        };

        _initialized = true;
        return compose;
    };


    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = compose;
    }
    else {

        var deps = [
            'bluebird',
            'utils/List', 'client', 'WebObject', 'ServiceObject',
            'platforms/mqtt/browser', 'platforms/websocket/browser', 'platforms/http/browser'
        ];

        if (typeof define === 'function' && define.amd) {
            define(deps, function() {
                return compose;
            });
        }
        else {

            window.Compose = compose;
            if(typeof window.require === 'undefined') {

                var _requireAlias = {
                    "bluebird": "vendors/bluebird/browser/bluebird"
                };

                var isReady = false;
                var onLoadCallback;

                window.Compose.ready = function(cb) {
                    onLoadCallback = cb;
                    if(isReady) cb();
                };

                var _d = [];
                for(var i in deps) {
                    _d.push( _requireAlias[deps[i]] ? _requireAlias[deps[i]] : deps[i] );
                }

                (function() {

                    var basepath;
                    var modules = document.getElementsByTagName("script");
                    for(var i in modules) {
                        if(modules[i].src && modules[i].src.match(/\/compose\.io\/index/)) {
                            basepath = modules[i].src.replace("index.js", "");
                            break;
                        }
                    }

                    var head = document.getElementsByTagName("head")[0];
                    var append = function(src, then) {
                        var script = document.createElement("script");
                        script.src = basepath + src + ".js";
                        script.onload = then;
                        head.appendChild(script);
                    };

                    var c = 0;
                    var _counter = function() {
                        c--;
                        if(c === 0) {
                            // call on load!
                            onLoadCallback && onLoadCallback();
                            isReady = true;
                        }
                    };

                    while(_d.length) {
                        c++;
                        append(_d.shift(), _counter);
                    }

                })();

                window.require = function(requiredName) {
                    if(requiredName.match(/bluebird/)) {
                        return window.Promise;
                    }
                    var module = "__$" + requiredName.replace(".\/", "").replace("\/", "_", "g");
                    return window[module];
                };
            };
        }
    }


}).call(this);