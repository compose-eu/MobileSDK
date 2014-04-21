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

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URL;

import org.apache.http.HttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.util.EntityUtils;

import android.os.AsyncTask;
import android.util.Log;

public class ServerRequestTask extends AsyncTask<Void, Void, Void> {
	private URL POSTrequestUrl;
	private URL PUTrequestUrl;
	private String request_type;

	private String header_parameters;
	private String message;

	private boolean DEBUG = false;

	private String DEBUG_INFO = "COMPOSE_DEBUG";


	public ServerRequestTask(URL requestUrl, String request_type, String API_token, String message, boolean DEBUG) {
		if(request_type.equals("POST")) {
			this.POSTrequestUrl = requestUrl;
		}

		if(request_type.equals("PUT")) {
			this.PUTrequestUrl = requestUrl;
		}

		this.request_type = request_type;
		this.header_parameters = API_token;
		this.message = message;
		this.DEBUG = DEBUG;

	}

	public String doPOSTRequest(URL requestUrl) {
		String responseString = null;
		int responseCode = 0;

		DefaultHttpClient httpclient = new DefaultHttpClient();

		HttpPost httpPost = null;

		try {
			httpPost = new HttpPost(requestUrl.toString());
			if(header_parameters != null) {
				httpPost.setHeader("Content-type", "application/json");
				httpPost.setHeader("Authorization",header_parameters);
			}


			StringEntity se = new StringEntity(this.message, "utf-8");
			httpPost.setEntity(se);


			HttpResponse response = null;

			response = httpclient.execute(httpPost);
			responseString = EntityUtils.toString(response
					.getEntity(), "UTF-8");
			responseCode = response.getStatusLine().getStatusCode();

			responseString = String.valueOf(responseCode);

			if(DEBUG) {
				Log.i(DEBUG_INFO, responseString);
			}

		} catch (Exception e) {
			responseString = e.toString();
			e.printStackTrace();
		}

		return responseString;
	}

	public String doPUTRequest(URL requestUrl) {
		String responseString = null;

		try {
			HttpURLConnection httpCon = (HttpURLConnection) requestUrl.openConnection();
			httpCon.setDoOutput(true);
			httpCon.setDoInput(true);
			httpCon.setRequestMethod("PUT");
			httpCon.setRequestProperty("Content-Type", "application/json" );
			httpCon.setRequestProperty("Authorization", header_parameters );
			httpCon.setRequestProperty("User-Agent","Mozilla/5.0 ( compatible ) ");
			httpCon.setRequestProperty("Accept","*/*");

			OutputStreamWriter out = new OutputStreamWriter(
					httpCon.getOutputStream());
			out.write(""+this.message);
			out.close();

			if(DEBUG) {
				BufferedReader in=null;
				if(httpCon.getErrorStream()!=null)
					in = new BufferedReader(new InputStreamReader(httpCon.getErrorStream()));
				else
					in = new BufferedReader(new InputStreamReader(httpCon.getInputStream()));
				String inputLine;

				while ((inputLine = in.readLine()) != null) {

					Log.i(DEBUG_INFO, inputLine);
				}
				in.close();

			}

		}catch (Exception e) {
			e.printStackTrace();
		}

		return responseString;
	}


	@Override
	protected Void doInBackground(Void... arg0) {
		// TODO Auto-generated method stub

		if(this.request_type.equals("POST")) {
			System.err.println("Doing POST request now...");
			doPOSTRequest(this.POSTrequestUrl);
		}
		if(this.request_type.equals("PUT")) {
			System.err.println("Doing PUT request now...");
			doPUTRequest(this.PUTrequestUrl);
		}
		return null;
	}

}
