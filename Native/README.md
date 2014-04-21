COMPOSE Native Android Library
================


The COMPOSE Native library imported into any Android project and provides functionality for:

- Easily storing  data on a Service Object (SO) created through [Servioticy]
- Subscribing to notifications from Servioticy 

Currently the subscription is performed over MQTT.

For storing data on SOs you can select between using the COMPOSE HTTP RESTful API or using MQTT as a communication channel.

For more information on how the REST API or the MQTT communication [works], please read the Servioticy [documentation].


Installation
----

- Import the COMPOSE Library (Android->Library->COMPOSE_Android.jar) into your Android project.
- Edit the AndroidManifest.xml file and add the following:

-- before the application tag:
```java
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.READ_PHONE_STATE"/>
```
-- inside the application tag:
```java
<service android:enabled="true" android:name="org.compose.mobilesdk.android.COMPOSESubService">
    <intent-filter>
        <action android:name="org.compose.mobilesdk.android.COMPOSESubService" />
    </intent-filter>
</service>
```

Usage
----

To use the library you need to create a COMPOSEsdk object:
```java
	COMPOSEsdk compose;
```
set the following variables accordingly:
```java
	private String COMPOSE_API_TOKEN = "YOUR_API_TOKEN";
	private String stream_name = "STREAM_NAME";
	private String SO_ID = "SERVICE_OBJECT_ID";
```

and instantiate the COMPOSEsdk object:
```java
	compose = new COMPOSEsdk(this, COMPOSE_API_TOKEN);
```

### Storing channel data
To store channel data you can use the SO_channel data objects:
```java
	SO_channel chn1 = new SO_channel("This is channel's name","this is current value");
	compose.addSO_channel(chn1);
```

### Adding REST and MQTT endpointd and credentials
By default, the library will use the Servioticy endpoints (api.servioticy.com) for storing data. To modify these, use the following methods:

```java
	compose.setRESTServer(string_server_url, 8010);
	compose.setMQTTServer(string_mqtt_broker, 1383);
	compose.setMQTTCredentials("compose", "shines");
```

### Updating the SO stream with the new data
To update the SO, simply invoke the updateSO_REST or updateSO_MQTT method:
```java
	try {
			compose.updateSO_REST(stream_name, SO_ID);
		} catch (Exception e) {
			e.printStackTrace();
	}
```



### Subscribing to notifications
TO subscribe to notifications you need to add and register a BroadcastReceiver that will provide you with access to incoming data from the subscription channel:

```java
private BroadcastReceiver mMessageReceiver = new BroadcastReceiver() {
		@Override
		public void onReceive(Context context, Intent intent) {
			Bundle data = intent.getExtras();
			//do something with the data:
			System.out.println(data.getString("DATA"));
		}
	};
```

and the register the BroadcastReceiver inside the onCreate() method of your Activity:
```java
LocalBroadcastManager.getInstance(this).registerReceiver(mMessageReceiver, new IntentFilter("COMPOSE"));
```

In addition to this, you need to also subscribe to a specific SO topic for notifications:

```java
compose.subscribe_MQTT(true, "TOPIC/to");
```

Example
----
You can also check the provided Android app as an example on how to use the COMPOSE Library (Android->Example->COMPOSE_Example)

[Servioticy]:http://www.servioticy.com/
[documentation]:http://www.servioticy.com/?page_id=27
[works]:http://www.servioticy.com/?page_id=273