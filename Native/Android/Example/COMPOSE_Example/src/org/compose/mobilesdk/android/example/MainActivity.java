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
package org.compose.mobilesdk.android.example;


import android.support.v4.app.Fragment;
import android.support.v4.content.LocalBroadcastManager;
import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Bundle;
import android.view.Menu;
import android.view.MenuItem;




//import the compose library
import org.compose.mobilesdk.android.COMPOSEsdk;
import org.compose.mobilesdk.android.COMPOSESubService;
import org.compose.mobilesdk.android.SO_channel;

public class MainActivity extends Activity {

	COMPOSEsdk compose;
	private String COMPOSE_API_TOKEN = "YOUR_API_TOKEN";
	private String stream_name = "STREAM_NAME";
	private String SO_ID = "SERVICE_OBJECT_ID";

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		//setContentView(R.layout.activity_main);

		//instantiate the compose object:
		compose = new COMPOSEsdk(this, COMPOSE_API_TOKEN);

		//Populate some SO channel data:
		/*Suppose the SO schema is similar to:
		{
    	"name": "twitter_hashmap",
    	"description": "map of twitter #iot hashtags",
    	"URL": "",
    	"streams": {
        	"My stream": {
            	"channels": {
                	"location": {
                    	"type": "string"
                	},
                	"feed": {
                    	"type": "string"
                	},
                	"user": {
                    	"type": "string"
                	}

            	}
        	}
    	},
    	"customFields": {},
    	"actions": [],
    	"properties": []
		}
		 */
		SO_channel chn1 = new SO_channel("feed","this is a test3");
		compose.addSO_channel(chn1);
		chn1 = new SO_channel("user","android_compose3");
		compose.addSO_channel(chn1);
		chn1 = new SO_channel("location","trento");
		compose.addSO_channel(chn1);
		
		compose.setDEBUG(true);

		//Use the default servioticy endpoint to push data to the SO:
		try {
			compose.updateSO_REST(stream_name, SO_ID);
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
		//in case you wish to do it over MQTT:
		/*
		 try {
			compose.setMQTTCredentials("compose", "shines");
			compose.updateSO_MQTT(stream_name, SO_ID);
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
		 * 
		 */
		
		//subscribe to notifications from COMPOSE channel:
		compose.setMQTTCredentials("compose", "shines");
		compose.subscribe_MQTT(true, "OWIzZjk4MmUtMjNlOC00ZTZkLWI3YjItY2JkMGEwYzNiMzJmYzI4Y2RlNTMtNzFmYy00MzY5LWE5M2YtZmUyYzUzOTVkYTFj/to");
		
		
		//register broadcast receiver for messages from COMPOSE MQTT subscription channel
		LocalBroadcastManager.getInstance(this).registerReceiver(mMessageReceiver, new IntentFilter("COMPOSE"));
	}


	//Implement here the Broadcast receiver for parsing data over COMPOSE MQTT channel subscription
	private BroadcastReceiver mMessageReceiver = new BroadcastReceiver() {
		@Override
		public void onReceive(Context context, Intent intent) {
			Bundle data = intent.getExtras();
			//do something with the data:
			System.out.println(data.getString("DATA"));
		}
	};

	@Override
	public boolean onCreateOptionsMenu(Menu menu) {

		// Inflate the menu; this adds items to the action bar if it is present.
		//getMenuInflater().inflate(R.menu.main, menu);
		return true;
	}

	@Override
	public boolean onOptionsItemSelected(MenuItem item) {
		// Handle action bar item clicks here. The action bar will
		// automatically handle clicks on the Home/Up button, so long
		// as you specify a parent activity in AndroidManifest.xml.
		int id = item.getItemId();
		
		return super.onOptionsItemSelected(item);
	}

	/**
	 * A placeholder fragment containing a simple view.
	 */
	public static class PlaceholderFragment extends Fragment {

		public PlaceholderFragment() {
		}

		
	}

}
