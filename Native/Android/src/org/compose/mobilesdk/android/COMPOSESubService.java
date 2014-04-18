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

package org.compose.mobilesdk.android;

import java.util.Locale;

import org.eclipse.paho.client.mqttv3.IMqttDeliveryToken;
import org.eclipse.paho.client.mqttv3.MqttCallback;
import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttDeliveryToken;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.eclipse.paho.client.mqttv3.MqttPersistenceException;
import org.eclipse.paho.client.mqttv3.MqttTopic;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.eclipse.paho.client.mqttv3.persist.MqttDefaultFilePersistence;


import android.app.AlarmManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.IBinder;
import android.provider.Settings.Secure;
import android.support.v4.content.LocalBroadcastManager;
import android.util.Log;

public class COMPOSESubService extends Service implements MqttCallback{
	
	public static final String 		DEBUG_TAG = "COMPOSESubService"; // Debug TAG

	private static final String		MQTT_THREAD_NAME = "MqttService[" + DEBUG_TAG + "]"; // Handler Thread ID

	private static  String 			MQTT_BROKER = "api.servioticy.com"; // Broker URL or IP Address
	private static  int 			MQTT_PORT = 1883;				// Broker Port

	public static final int			MQTT_QOS_0 = 0; // QOS Level 0 ( Delivery Once no confirmation )
	public static final int 		MQTT_QOS_1 = 1; // QOS Level 1 ( Delevery at least Once with confirmation )
	public static final int			MQTT_QOS_2 = 2; // QOS Level 2 ( Delivery only once with confirmation with handshake )

	private static final int 		MQTT_KEEP_ALIVE = 240000; // KeepAlive Interval in MS
	private static final String		MQTT_KEEP_ALIVE_TOPIC_FORAMT = "/users/%s/keepalive"; // Topic format for KeepAlives
	private static final byte[] 	MQTT_KEEP_ALIVE_MESSAGE = { 0 }; // Keep Alive message to send
	private static final int		MQTT_KEEP_ALIVE_QOS = MQTT_QOS_0; // Default Keepalive QOS

	private static final boolean 	MQTT_CLEAN_SESSION = true; // Start a clean session?

	private static final String 	MQTT_URL_FORMAT = "tcp://%s:%d"; // URL Format normally don't change

	private static final String 	ACTION_START 	= DEBUG_TAG + ".START"; // Action to start
	private static final String 	ACTION_STOP		= DEBUG_TAG + ".STOP"; // Action to stop
	private static final String 	ACTION_KEEPALIVE= DEBUG_TAG + ".KEEPALIVE"; // Action to keep alive used by alarm manager
	private static final String 	ACTION_RECONNECT= DEBUG_TAG + ".RECONNECT"; // Action to reconnect


	private static final String 	DEVICE_ID_FORMAT = "andr_%s"; // Device ID Format, add any prefix you'd like
	// Note: There is a 23 character limit you will get
	// An NPE if you go over that limit
	private boolean mStarted = false; // Is the Client started?
	private String mDeviceId;		  // Device ID, Secure.ANDROID_ID
	private Handler mConnHandler;	  // Seperate Handler thread for networking

	private MqttDefaultFilePersistence mDataStore; // Defaults to FileStore
	private MemoryPersistence mMemStore; 		// On Fail reverts to MemoryStore
	private MqttConnectOptions mOpts;			// Connection Options

	private MqttTopic mKeepAliveTopic;			// Instance Variable for Keepalive topic

	private MqttClient mClient;					// Mqtt Client

	private AlarmManager mAlarmManager;			// Alarm manager to perform repeating tasks
	private ConnectivityManager mConnectivityManager; // To check for connectivity changes

	
	private String mqtt_username;
	private String mqtt_password;
	
	private String COMPOSE_topic;
	
	public void setMQTTCredentials(String username, String password) {
		this.mqtt_password = password;
		this.mqtt_username = username;
	}
	
	public void setMQTTBroker(String server, int port) {
		this.MQTT_BROKER = server;
		this.MQTT_PORT = port;
	}
	
	public void setCOMPOSETopic(String topic) {
		this.COMPOSE_topic = topic;
	}
	
	private String getCOMPOSETopic() {
		return this.COMPOSE_topic;
	}
	
	/**
	 * Start MQTT Client
	 * @param Context context to start the service with
	 * @return void
	 */
	public static void actionStart(Context ctx) {
		Intent i = new Intent(ctx,COMPOSESubService.class);
		i.setAction(ACTION_START);
		ctx.startService(i);
	}
	/**
	 * Stop MQTT Client
	 * @param Context context to start the service with
	 * @return void
	 */
	public static void actionStop(Context ctx) {
		Intent i = new Intent(ctx,COMPOSESubService.class);
		i.setAction(ACTION_STOP);
		ctx.startService(i);
	}
	/**
	 * Send a KeepAlive Message
	 * @param Context context to start the service with
	 * @return void
	 */
	public static void actionKeepalive(Context ctx) {
		Intent i = new Intent(ctx,COMPOSESubService.class);
		i.setAction(ACTION_KEEPALIVE);
		ctx.startService(i);
	}


	@Override
	public IBinder onBind(Intent intent) {
		// TODO Auto-generated method stub
		return null;
	}
	
	@Override
	public void onCreate() {
		super.onCreate();

		mDeviceId = String.format(DEVICE_ID_FORMAT, 
				Secure.getString(getContentResolver(), Secure.ANDROID_ID));

		HandlerThread thread = new HandlerThread(MQTT_THREAD_NAME);
		thread.start();

		mConnHandler = new Handler(thread.getLooper());

		try {
			mDataStore = new MqttDefaultFilePersistence(getCacheDir().getAbsolutePath());
		} catch(Exception e) {
			e.printStackTrace();
			mDataStore = null;
			mMemStore = new MemoryPersistence();
		}

		mOpts = new MqttConnectOptions();
		mOpts.setCleanSession(MQTT_CLEAN_SESSION);
		// Do not set keep alive interval on mOpts we keep track of it with alarm's

		mAlarmManager = (AlarmManager) getSystemService(ALARM_SERVICE);
		mConnectivityManager = (ConnectivityManager) getSystemService(CONNECTIVITY_SERVICE);
	}
	
	/**
	 * Service onStartCommand
	 * Handles the action passed via the Intent
	 * 
	 * @return START_REDELIVER_INTENT
	 */
	@Override
	public int onStartCommand(Intent intent, int flags, int startId) {
		super.onStartCommand(intent, flags, startId);
		
		if(intent.getStringExtra("MQTT_BROKER")!=null) {
			MQTT_BROKER = intent.getStringExtra("MQTT_BROKER");
		}
		
		
			MQTT_PORT = intent.getIntExtra("MQTT_PORT", 1883);
		
		
		if(intent.getStringExtra("MQTT_USERNAME")!=null) {
			mqtt_username = intent.getStringExtra("MQTT_USERNAME");
		}
		
		if(intent.getStringExtra("MQTT_PASSWORD")!=null) {
			mqtt_password = intent.getStringExtra("MQTT_PASSWORD");
		}
		
		if(intent.getStringExtra("MQTT_TOPIC")!=null) {
			COMPOSE_topic = intent.getStringExtra("MQTT_TOPIC");
		}

		String action = intent.getAction();

		//Log.i(DEBUG_TAG,"Received action of " + action);

		if(action == null) {
			Log.i(DEBUG_TAG,"Starting service with no action\n Probably from a crash");
		} else {
			if(action.equals(ACTION_START)) {
				//Log.i(DEBUG_TAG,"Received ACTION_START");
				start();
			} else if(action.equals(ACTION_STOP)) {
				stop();
			} else if(action.equals(ACTION_KEEPALIVE)) {
				keepAlive();
			} else if(action.equals(ACTION_RECONNECT)) {
				if(isNetworkAvailable()) {
					reconnectIfNecessary();
				}
			}
		}

		return START_REDELIVER_INTENT;
	}
	
	/**
	 * Attempts connect to the Mqtt Broker
	 * and listen for Connectivity changes
	 * via ConnectivityManager.CONNECTVITIY_ACTION BroadcastReceiver
	 */
	private synchronized void start() {
		if(mStarted) {
			Log.i(DEBUG_TAG,"Attempt to start while already started");
			return;
		}

		if(hasScheduledKeepAlives()) {
			stopKeepAlives();
		}

		connect();

		registerReceiver(mConnectivityReceiver,new IntentFilter(ConnectivityManager.CONNECTIVITY_ACTION));
	}
	
	/**
	 * Attempts to stop the Mqtt client
	 * as well as halting all keep alive messages queued
	 * in the alarm manager
	 */
	private synchronized void stop() {
		if(!mStarted) {
			Log.i(DEBUG_TAG,"Attemtpign to stop connection that isn't running");
			return;
		}

		if(mClient != null) {
			mConnHandler.post(new Runnable() {
				@Override
				public void run() {
					try {
						mClient.disconnect();
					} catch(MqttException ex) {
						ex.printStackTrace();
					}
					mClient = null;
					mStarted = false;

					stopKeepAlives();
				}
			});
		}

		unregisterReceiver(mConnectivityReceiver);
	}
	/**
	 * Connects to the broker with the appropriate datastore
	 */
	private synchronized void connect() {
		String url = String.format(Locale.US, MQTT_URL_FORMAT, MQTT_BROKER, MQTT_PORT);
		//Log.i(DEBUG_TAG,"Connecting with URL: " + url);
		try {
			if(mDataStore != null) {
				//Log.i(DEBUG_TAG,"Connecting with DataStore");
				mClient = new MqttClient(url,mDeviceId,mDataStore);
			} else {
				//Log.i(DEBUG_TAG,"Connecting with MemStore");
				mClient = new MqttClient(url,mDeviceId,mMemStore);
			}
		} catch(MqttException e) {
			e.printStackTrace();
		}
		
		//check for login credentials:
		if(this.mqtt_password!=null && this.mqtt_username!=null) {
			mOpts.setUserName(this.mqtt_username);
			mOpts.setPassword(this.mqtt_password.toCharArray());
		}

		mConnHandler.post(new Runnable() {
			@Override
			public void run() {
				try {
					
					mClient.connect(mOpts);

					mClient.subscribe(getCOMPOSETopic(), 0);

					mClient.setCallback(COMPOSESubService.this);

					mStarted = true; // Service is now connected

					Log.i(DEBUG_TAG,"Successfully connected to COMPOSE..listening for events");

					startKeepAlives();
				} catch(MqttException e) {
					e.printStackTrace();
				}
			}
		});
	}
	/**
	 * Schedules keep alives via a PendingIntent
	 * in the Alarm Manager
	 */
	private void startKeepAlives() {
		Intent i = new Intent();
		i.setClass(this, COMPOSESubService.class);
		i.setAction(ACTION_KEEPALIVE);
		PendingIntent pi = PendingIntent.getService(this, 0, i, 0);
		mAlarmManager.setRepeating(AlarmManager.RTC_WAKEUP,
				System.currentTimeMillis() + MQTT_KEEP_ALIVE,
				MQTT_KEEP_ALIVE, pi);
	}
	/**
	 * Cancels the Pending Intent
	 * in the alarm manager
	 */
	private void stopKeepAlives() {
		Intent i = new Intent();
		i.setClass(this, COMPOSESubService.class);
		i.setAction(ACTION_KEEPALIVE);
		PendingIntent pi = PendingIntent.getService(this, 0, i , 0);
		mAlarmManager.cancel(pi);
	}
	/**
	 * Publishes a KeepALive to the topic
	 * in the broker
	 */
	private synchronized void keepAlive() {
		if(isConnected()) {
			try {
				sendKeepAlive();
				return;
			} catch(MqttConnectivityException ex) {
				ex.printStackTrace();
				reconnectIfNecessary();
			} catch(MqttPersistenceException ex) {
				ex.printStackTrace();
				stop();
			} catch(MqttException ex) {
				ex.printStackTrace();
				stop();
			}
		}
	}
	
	/**
	 * Checkes the current connectivity
	 * and reconnects if it is required.
	 */
	private synchronized void reconnectIfNecessary() {
		if(mStarted && mClient == null) {
			connect();
		}
	}
	/**
	 * Query's the NetworkInfo via ConnectivityManager
	 * to return the current connected state
	 * @return boolean true if we are connected false otherwise
	 */
	private boolean isNetworkAvailable() {
		NetworkInfo info = mConnectivityManager.getActiveNetworkInfo();

		return (info == null) ? false : info.isConnected();
	}
	/**
	 * Verifies the client State with our local connected state
	 * @return true if its a match we are connected false if we aren't connected
	 */
	private boolean isConnected() {
		if(mStarted && mClient != null && !mClient.isConnected()) {
			Log.i(DEBUG_TAG,"Mismatch between what we think is connected and what is connected");
		}

		if(mClient != null) {
			return (mStarted && mClient.isConnected()) ? true : false;
		}

		return false;
	}
	/**
	 * Receiver that listens for connectivity chanes
	 * via ConnectivityManager
	 */
	private final BroadcastReceiver mConnectivityReceiver = new BroadcastReceiver() {
		@Override
		public void onReceive(Context context, Intent intent) {
			//Log.i(DEBUG_TAG,"Connectivity Changed...");
		}
	};
	/**
	 * Sends a Keep Alive message to the specified topic
	 * @see MQTT_KEEP_ALIVE_MESSAGE
	 * @see MQTT_KEEP_ALIVE_TOPIC_FORMAT
	 * @return MqttDeliveryToken specified token you can choose to wait for completion
	 */
	private synchronized MqttDeliveryToken sendKeepAlive()
			throws MqttConnectivityException, MqttPersistenceException, MqttException {
		if(!isConnected())
			throw new MqttConnectivityException();

		if(mKeepAliveTopic == null) {
			mKeepAliveTopic = mClient.getTopic(
					String.format(Locale.US, MQTT_KEEP_ALIVE_TOPIC_FORAMT,mDeviceId));
		}

		//Log.i(DEBUG_TAG,"Sending Keepalive to " + MQTT_BROKER);

		MqttMessage message = new MqttMessage(MQTT_KEEP_ALIVE_MESSAGE);
		message.setQos(MQTT_KEEP_ALIVE_QOS);

		return mKeepAliveTopic.publish(message);
	}
	/**
	 * Query's the AlarmManager to check if there is
	 * a keep alive currently scheduled
	 * @return true if there is currently one scheduled false otherwise
	 */
	private synchronized boolean hasScheduledKeepAlives() {
		Intent i = new Intent();
		i.setClass(this, COMPOSESubService.class);
		i.setAction(ACTION_KEEPALIVE);
		PendingIntent pi = PendingIntent.getBroadcast(this, 0, i, PendingIntent.FLAG_NO_CREATE);

		return (pi != null) ? true : false;
	}
	
	/**
	 * Connectivity Lost from broker
	 */
	@Override
	public void connectionLost(Throwable arg0) {
		stopKeepAlives();

		mClient = null;

		if(isNetworkAvailable()) {
			reconnectIfNecessary();
		}
	}


	/**
	 * MqttConnectivityException Exception class
	 */
	private class MqttConnectivityException extends Exception {
		private static final long serialVersionUID = -7385866796799469420L; 
	}
	@Override
	public void messageArrived(String topic, MqttMessage message)
			throws Exception {
		// TODO Auto-generated method stub
		String in = new String(message.getPayload());

		

			Intent intent = new Intent("COMPOSE");

			intent.putExtra("DATA", new String(message.getPayload()));
			LocalBroadcastManager.getInstance(this).sendBroadcast(intent);
			

	}
	@Override
	public void deliveryComplete(IMqttDeliveryToken token) {
		// TODO Auto-generated method stub

	}

}
