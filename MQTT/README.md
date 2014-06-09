#Titanium Tutorial Compose


##1. Get the Library

Download mqtt titanium module and put it under your titanium folder
    
    Titanium/modules/android/ 


##2. Add the module

On your titanium project in __tiapp.xml__ add the following lines

    <modules>
             <module platform="android">it.uhopper.mqtt</module>
    </modules>
    
    
##3. How to use it

In index.js 

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
		callback: function(d){
			Ti.API.info("notification " + JSON.stringify(d));
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
	
	
	
	//close mqtt connection
	mqtt.unregisterForNotification({
		success: function(data){},
		error: function(data){}
	})
	
	
	
		