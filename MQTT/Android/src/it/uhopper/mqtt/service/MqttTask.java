package it.uhopper.mqtt.service;

import android.content.Context;
import android.util.Log;
import android.util.Pair;

import org.appcelerator.kroll.KrollFunction;
import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;

import it.uhopper.mqtt.MqttModule;

import java.io.IOException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;


public class MqttTask implements Runnable {
    static final String TAG = MqttTask.class.getSimpleName();
    String ID;

    HashMap<String, Integer> topics = new HashMap<String, Integer>();

    String host;

    Context ctx;

    MqttCallbackImplementation callback;


    boolean initialized = false;

    private MqttClient mqttClient;
    MqttConstants.MQTTConnectionStatus connectionStatus;


    public MqttTask(Context ctx, String[] TOPICS, int[] qos, MqttCallbackImplementation callback) {
        this.callback = callback;


        if(TOPICS.length != qos.length) {
            Log.w(TAG, "Number of topics and qos does not match ! Using default value");

            for (String s : TOPICS) {
                this.topics.put(s, 0);
            }
        }else{
            for(int i =0; i< TOPICS.length; i++){
                this.topics.put(TOPICS[i], qos[i]);
            }
        }


        this.ctx = ctx;
    }


    public void run() {
        Log.i(TAG, "Starting MQTT THREAD with ID: " + ID);
        initialized = false;
        try {
            ID = MqttConstants.getUniqueID(ctx);

            host = MqttConstants.HOST;


            // TODO in case of error, maybe retry after N seconds ?
            defineConnectionToBroker(host);

            Log.i(TAG, "Connecting to broker " + MqttConstants.HOST);
            connectToBroker();

            Log.i(TAG, "Connected!");

            subscribeToTopics();

            Log.i(TAG, "Subscribed!");
            
            KrollFunction kf = MqttModule.eventsMap.get("onSuccess");
        	Object[] arr = {"success : true"};
        	kf.callAsync(MqttModule.getInstance().getKrollObject(), arr);

        } catch (MqttException e) {
            Log.e(TAG, "FATAL exception");
            KrollFunction kf = MqttModule.eventsMap.get("onError");
        	Object[] arr = {"success : false"};
        	kf.callAsync(MqttModule.getInstance().getKrollObject(), arr);
        	
            e.printStackTrace();
        }  
        initialized = true;
        Log.i(TAG, "++++++++++++++++++++++++End of Command+++++++++++++++++++++");

    }


    private void defineConnectionToBroker(String host) throws MqttException {
        mqttClient = new MqttClient(host, ID, new MemoryPersistence());
        mqttClient.setCallback(callback);
        connectionStatus = MqttConstants.MQTTConnectionStatus.INITIAL;

    }


    private void connectToBroker() throws MqttException {
        MqttConnectOptions connectOptions = new MqttConnectOptions();
//        connectOptions.setKeepAliveInterval(keepAliveSeconds);
        connectOptions.setUserName("compose");
        connectOptions.setPassword("shines".toCharArray());
        mqttClient.connect(connectOptions);

    }

    private void subscribeToTopics() throws MqttException {
        boolean subscribed = false;
        if (isAlreadyConnected() == true) {
            try {
                String topics_arr[] = new String[topics.size()];
                int qos_arr[] = new int[topics.size()];

                Set<Map.Entry<String, Integer>> pairs = topics.entrySet();

                int i = 0;
                for(Map.Entry<String, Integer> p : pairs){
                    topics_arr[i] = p.getKey();
                    qos_arr[i] = p.getValue();
                    i++;
                }

                mqttClient.subscribe(topics_arr, qos_arr);
                subscribed = true;
            } catch (MqttException e) {
                e.printStackTrace();
                subscribed = false;
            }

            if (subscribed == false) {
                throw new MqttException(MqttException.REASON_CODE_CLIENT_EXCEPTION);
            }
        }

    }


    public boolean publish(String topic, String payload, int qos, boolean retain) {
        try {
            MqttMessage msg = new MqttMessage();

            msg.setPayload(payload.getBytes());
            msg.setQos(qos);
            msg.setRetained(retain);
            mqttClient.publish(topic, msg);
            return true;
        } catch (Exception e) {
            return false;
        }
    }


    public void addSubscription(String str, Integer qos) throws MqttException {

        if(qos  != topics.put(str,qos) ){// True if str is a new topic or qos is changed
            mqttClient.subscribe(str, qos);
        }
    }

    public void removeSubscription(String str) throws MqttException {
        if(topics.remove(str)!= null){// True if str was a topic
            mqttClient.unsubscribe(str);
        }
    }


    //TODO maybe handle multiple topic un/subscription



    public boolean isAlreadyConnected() {
        return ((mqttClient != null) && (mqttClient.isConnected() == true));
    }



    public boolean isInitialized(){
        return initialized;
    }


    public String subscriptions(){
        return Arrays.toString(topics.keySet().toArray(new String[topics.size()]));
    }


}
