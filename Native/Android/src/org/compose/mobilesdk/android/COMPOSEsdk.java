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


import java.net.URL;
import java.util.ArrayList;

import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;

import android.content.Context;
import android.content.Intent;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.telephony.TelephonyManager;

public class COMPOSEsdk {
	static Context context;
	
	private String auth_token="";
	private String mqtt_password, mqtt_username;
	private Intent COMPOSESub;
	private String rest_server_url = "api.servioticy.com";
	private String mqtt_server_url = "api.servioticy.com";
	private int rest_server_port = 80;
	private int mqtt_server_port = 1883;
	private boolean DEBUG = false;
	
	
	private ArrayList<SO_channel> list = new ArrayList<SO_channel>();
	
	public void setRESTServer(String url, int port) {
		this.rest_server_url = url;
		this.rest_server_port = port;
	}
	
	public void setMQTTServer(String url, int port) {
		this.mqtt_server_url = url;
		this.mqtt_server_port = port;
		
	}
	
	public void addSO_channel(SO_channel chnl) {
		list.add(chnl);
	}
	
	public COMPOSEsdk(Context mContext, String auth_token) {
		this.context = mContext;
		this.auth_token = auth_token;
	}
	
	public void setDEBUG(boolean flag) {
		this.DEBUG = flag;
	}
	
	
	public int updateSO_REST(String stream_name, String SOID) throws Exception{
		int returnCode = 0;
		String message = "";
		
		if(isNetworkConnected()) {
			//construct the JSON:
			
			String body = "{\"lastUpdate\": "+System.currentTimeMillis()+",\"channels\": {";
			SO_channel tempChannel;
			for(int i=0;i<list.size()-1;i++) {
				tempChannel = list.get(i);
				body+="\""+tempChannel.getName()+"\": {\"current-value\": \""+tempChannel.getValue()+"\"},";
			}
			tempChannel = list.get(list.size()-1);
			body += "\""+tempChannel.getName()+"\": {\"current-value\": \""+tempChannel.getValue()+"\"}}}";
			
			message = body;
			//System.out.println(message);
			//do the request through the Servioticy API:
			
				URL requestUrl = new URL("http://"+rest_server_url+":"+rest_server_port+"/"+SOID+"/streams/"+stream_name);
				ServerRequestTask putRequest = new ServerRequestTask(requestUrl, "PUT", getAPIToken(), message, DEBUG);
				putRequest.execute();
				returnCode = 1;
			
			
		}
		return returnCode;
		
	}
	
	public void setAPIToken(String token) {
		this.auth_token = token;
	}
	
	private String getAPIToken() {
		return this.auth_token;
	}
	
	
	
	
	private boolean isNetworkConnected() {
		ConnectivityManager cm = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
		NetworkInfo ni = cm.getActiveNetworkInfo();
		if (ni == null) {
			// There are no active networks.
			return false;
		} else
			return true;
	}
	
	public void setMQTTCredentials (String username, String password) {
		this.mqtt_password = password;
		this.mqtt_username = username;
		
	}
	
	public void subscribe_MQTT(boolean status, String topic) {
		if(status) {
			COMPOSESub = new Intent(context, COMPOSESubService.class);
			COMPOSESub.setAction("COMPOSESubService.START");
			//add params:
			COMPOSESub.putExtra("MQTT_BROKER", mqtt_server_url);
			COMPOSESub.putExtra("MQTT_PORT", mqtt_server_port);
			COMPOSESub.putExtra("MQTT_USERNAME", mqtt_username);
			COMPOSESub.putExtra("MQTT_PASSWORD", mqtt_password);
			COMPOSESub.putExtra("MQTT_TOPIC", topic);
			context.startService(COMPOSESub);
		}
	}
	
	public void updateSO_MQTT(String stream_name, String SOID) throws Exception {
		String header = "{\"meta\": {\"authorization\": \""+getAPIToken()+"\",\"method\": \"PUT\",\"url\": \"/"+SOID+"/streams/"+stream_name+"\"},";
		
		String body = "\"body\": {\"lastUpdate\": "+System.currentTimeMillis()+",\"channels\": {";
		SO_channel tempChannel;
		for(int i=0;i<list.size()-1;i++) {
			tempChannel = list.get(i);
			body+="\""+tempChannel.getName()+"\": {\"current-value\": \""+tempChannel.getValue()+"\"},";
		}
		tempChannel = list.get(list.size()-1);
		body += "\""+tempChannel.getName()+"\": {\"current-value\": \""+tempChannel.getValue()+"\"}}}}";
		
		String message = header+""+body;
		
		MemoryPersistence mMemStore = new MemoryPersistence();
		MqttConnectOptions opt = new MqttConnectOptions();
		MqttClient mClient = new MqttClient("tcp://"+this.mqtt_server_url+":"+this.mqtt_server_port, ""+getDeviceID(),mMemStore);
		
		if(mqtt_username.length()>0 && mqtt_password.length()>0) {
		opt.setUserName(mqtt_username);
		opt.setPassword(mqtt_password.toCharArray());
		mClient.connect(opt);
		}else {
			mClient.connect();
		}
		
		MqttMessage mq_message = new MqttMessage();
		mq_message.setPayload(message.getBytes());
		mClient.publish(getAPIToken()+"/from", mq_message);
		mClient.disconnect();
		
	}
	
private String getDeviceID() {
		  
		String internal_uid = "";
		TelephonyManager tManager = (TelephonyManager)context.getSystemService(Context.TELEPHONY_SERVICE);
		internal_uid = tManager.getDeviceId();
		
		
		return internal_uid;
	}
}
