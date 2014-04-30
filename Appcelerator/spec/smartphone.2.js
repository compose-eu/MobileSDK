exports.definition = {
    "name": "Test Phone",
    "description": "My test phone",
    "URL": null,
    "public": false,
    "streams": {
        "address_book": {
            "description": "The addressbook number and the relation type",
            "type": "sensor",
            "channels": {
                "phone_hash": {
                    "type": "String"
                },
                "friend": {
                    "type": "Boolean"
                }
            }
        },
        "location": {
            "description": "SO location",
            "type": "sensor",
            "channels": {
                "phone_hash": {
                    "type": "String"
                },
                "friend": {
                    "type": "Boolean"
                }
            }
        },
        "accelerometer": {
            "description": "Report accellerometer data of the smartphone",
            "type": "sensor",
            "channels": {
                "x": {
                    "type": "Number",
                    "unit": "degrees"
                },
                "y": {
                    "type": "Number",
                    "unit": "degrees"
                },
                "z": {
                    "type": "Number",
                    "unit": "degrees"
                }
            }
        },
        "heading": {
            "description": "Report gyroscope/compass information of the smartphone",
            "type": "sensor",
            "channels": {
                "x": {
                    "type": "Number",
                    "unit": "degrees"
                },
                "y": {
                    "type": "Number",
                    "unit": "degrees"
                },
                "z": {
                    "type": "Number",
                    "unit": "degrees"
                }
            }
        },
        "location": {
            "description": "GPS based position and direction of the smartphone",
            "type": "sensor",
            "channels": {
                "latitude": {
                    "type": "Number",
                    "unit": "degrees"
                },
                "longitude": {
                    "type": "Number",
                    "unit": "degrees"
                }
            }
        },
        "availability": {
            "description": "Parameters to determine the availability of the smartphone",
            "type": "sensor",
            "channels": {
                "battery": {
                    "type": "Number",
                    "unit": "percentage"
                },
                "signal_strength": {
                    "type": "Number",
                    "unit": "percentage"
                }
            }
        },
        "testsuite": {
            "description": "Utility stream for test purposes",
            "type": "sensor",
            "channels": {
                "text": {
                    "type": "String"
                },
                "location": {
                    "type": "Array"
                },
                "number": {
                    "type": "Number"
                },
            }
        }
    },
    "customFields": {
        "testsuite": true,
        "hashnumber": "xxxxxyyyyyzzzzzzzzzz",
        "phone_details": {
            model: "some model",
            os: "android",
            api: "19"
        }
    },
    "actions": [],
    "properties": []
};