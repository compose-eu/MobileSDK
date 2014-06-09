var mqtt = require("it.uhopper.mqtt");  

	//registration for opening the mqtt channel
	//this is the first thing that should happen automatically as soon as app starts
	
	mqtt.registerCallback(Alloy.Globals.API_KEY, {
		success: function(data){
			Ti.API.info("Success : " + JSON.stringify(data));
		},
		error: function(data){
			Ti.API.info("Error : " + JSON.stringify(data)); 
		},
		callback: function(data){
			Ti.API.info("notification " + JSON.stringify(d));
			$.label.text = JSON.stringify(data, null, 2);	
		}
	});
	
	
	var meta_data = {
   			"meta": {
    			 "authorization": "API_TOKEN HERE",
     			"method": "PUT/GET/POST",
     			"url": "/full/path/to/destination"
   			},
   			"body": {
    			 <STRUCTURE OF THE JSON DOCUMENT YOU SHOULD SEND TO THE REST API>
   			}
		}
	//publish data into compose
	mqtt.publishData(Alloy.Globals.API_KEY, JSON.stringify(meta_data);	
	
	
	
$.index.open()
