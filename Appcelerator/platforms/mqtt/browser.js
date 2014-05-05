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

    var mqttlib = {};

    mqttlib.initialize = function(compose) {
        throw new compose.error.ComposeError("Browser support for mqtt has not been implemented yet!");
    };

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = mqttlib;
    }
    else {
        if (typeof define === 'function' && define.amd) {
            define(['compose'], function(compose) {
                return mqttlib;
            });
        }
        else {
            window.__$platforms_mqtt_browser = mqttlib;
        }
    }

})();