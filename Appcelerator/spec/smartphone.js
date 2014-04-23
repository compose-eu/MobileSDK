exports.definition = {  
   "name": "Phone", 
   "description": "COMPOSE phone", 
   "URL": "Web Object URL ",
   "public":"true",
   "streams": {
         "location": {
            "channels": {
                "latitude": {
                    "type": "Number",
                    "unit": "degrees"
                },
                "longitude": {
                    "type": "Number",
                    "unit": "degrees"
                }
            },
            "description": "GPS outdoor location",
            "type": "sensor"
        }
    },
    "customFields": {},
    "actions": [],
    "properties": []
};