Appcelerator COMPOSE Library
========

The Appcelerator COMPOSE Library is a JavaScript library designed to be used with the [Titanium Appcelerator] platform. The library hides the complexity of $

[Titanium Appcelerator]:http://www.appcelerator.com
[COMPOSE]:http://www.compose-project.eu
[REST API]:http://docs.servioticy.com/

Wrapper library to handle COMPOSE Service Objects in nodejs, titanium and the browser.

Example usage
--

```
// node.js or titanium
var compose = require("compose.io");
// browser
// <script src="js/compose.io/index.js"></script>

// simple setup
//compose.setup("<apiKey>");


compose.load("ServiceObject Id").then(function(so) {

    // this === so, the ServiceObject instance

    var stream = so.getStream("location");

    stream.listen(function(data) {
        console.log("New data received for " + this.name);
        console.log(data);
    });

    stream
        .setValue({
            latitude: 11.123,
            longitude: 45.321
        })
        .push().then(function() {
            console.log("Data stored for " + this.id);
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


```

(*) NOTE In order to use mqtt/websocket please use those bridge until not implemented in servioticy

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

`var compose = require('../path/compose.io');`


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
* listen - wait for data from a stream, only with mqtt and websocket on titanium)

*Subscriptions*

* CRUD - partial support, not yet implemented in backend


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
MIT
