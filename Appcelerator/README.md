Js COMPOSE Library
========

The Js COMPOSE Library is a JavaScript library designed to be used mainly with [Titanium Appcelerator] platform but will  work in nodejs and the browser too!.

[Titanium Appcelerator]:http://www.appcelerator.com
[COMPOSE]:http://www.compose-project.eu
[REST API]:http://docs.servioticy.com/


Example usage
--

```javascript
// node.js or titanium
var compose = require("compose.io");
// browser
// <script src="js/compose.io/index.js"></script>

// simple setup
//compose.setup("<apiKey>");
// detailed setup
compose.setup({
  apiKey: "api key",
  url: "http://api.servioticy.com",
  transport: "websocket", // or `mqtt` or `http`, the library will try to take the best one based on the platform
  websocket: { // has to match with the transport above
    url: "custom WS bridge",
    port: 8081,
    secure: false, // eg `ws` vs `wss`
  }
});

    
// Load by ServiceObject Id
compose.load("ServiceObject Id").then(function(so) {

    // this === so, the ServiceObject instance

    // data will come from any other SO
    so.on('data', function(data) {
        console.log("New data received for " + this.name);
        console.log(data);
    });

    var stream = so.getStream("location");
    stream
        .push({
            latitude: 11.123,
            longitude: 45.321
        })
        .then(function() {
            console.log("This callback is optional");
        });

});

// create a service object
compose.create({
    name: "Example SO",
    description: "an example SO",
    streams: {
        "stream_example": {
            name: "A stream sample",
            channels: {
                myname: {
                    type: "String"
                }
            }
        }
    }
}).then(function() {

    this.getStream("stream_example")
        .pull().then(function(data) {
            console.log("Data for stream " + this.name, data);
        });

})

// Read a definition, eg smartphone.json from definitions/ folder 
compose.read("smartphone")
    .then(function(smartphoneDefinition) {
        // this is the json-based SO representation
        console.log("Loaded Json", smartphoneDefinition.toJson());
        return smartphoneDefinition.create()
    })
    .then(function(smartphone) {
        // smartphone is the newly service object
        console.log("My id is " + smartphone.id);
    });



```

(*) NOTE In order to use mqtt/websocket please use those bridge until an alternative is available in servioticy

* [mqtt bridge](https://gist.github.com/muka/78d91529473f293b9df9)
* [websocket bridge](https://gist.github.com/muka/dba612c1fe33102f32ac)


Browser usage
--

*base usage*

`<script src="js/compose.io/index.js"></script>`

```
Compose.ready(function() {
    Compose.setup("<api key");
    Compose.list()
        .then(function(data) {
            console.log(data);
        })
        .catch(function(error) {
            console.log(error);
        });
});
```

*requirejs support*

A configuration like this is necessary at the moment

```
require.config({
    paths: {

        "compose": 'compose.io/index',
        "utils/List": 'compose.io/utils/List',
        "bluebird": 'compose.io/vendors/bluebird/browser/bluebird',
        "client": 'compose.io/client',
        "WebObject": 'compose.io/WebObject',
        "ServiceObject": 'compose.io/ServiceObject',

        "platforms/mqtt/browser": "compose.io/platforms/mqtt/browser",
        "platforms/websocket/browser": "compose.io/platforms/websocket/browser",
        "platforms/http/browser": "compose.io/platforms/http/browser"

    }
});
```

Titanium
---

In order to use websocket or mqtt, proper modules need to be loaded.

Place the library in `app/lib/` (for Alloy) or `Resources/`

`var compose = require('compose.io')`


Node
---

Library can be installed directly from repository with `npm i git://[path-to-repo].git`

`var compose = require('../path/compose');`


Current implementation
--

Async impl
--

Async request are implemented as [Promise](http://promises-aplus.github.io/promises-spec/), using the [bluebird](https://github.com/petkaantonov/bluebird) library


API support
---

Current status of the library follows the [Servioticy docs](http://docs.servioticy.com) reference implementation.

*Service Objects*

* create/load SO

*Streams*

* refresh - load a fresh list of streams
* push - send data
* pull - receive data list (filtered search adapted support TBD)

*Subscriptions*

* CRUD - partial support, not yet completely implemented


*Actuations*

NOT IMPLEMENTED



Tests
--

Unit tests are available in spec/ and use `jasmine-node` as engine for node.

Titanium tests support are under development and will use tishadow tests enviroment (jasmine)

Browser tests are not supported, yet.

`npm test`

Docs
--

API docs needs review. Can be generated using `jsdoc` and will be added to the repo once finished.

`npm install -g jsdoc`

`jsdoc ./`

License
--
Apache2

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
