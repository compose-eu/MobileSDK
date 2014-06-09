package it.uhopper.mqtt.service;

import it.uhopper.mqtt.MqttModule;

import java.io.Serializable;

import org.appcelerator.kroll.KrollFunction;
import org.eclipse.paho.client.mqttv3.IMqttDeliveryToken;
import org.eclipse.paho.client.mqttv3.MqttCallback;
import org.eclipse.paho.client.mqttv3.MqttMessage;

import android.content.Context;
import android.util.Log;


public class MqttCallbackImplementation implements MqttCallback, Serializable {

    private static final String TAG = "MQTT_CALLBACK";

    Context ctx;

    public MqttCallbackImplementation(Context ctx) {
        this.ctx = ctx;
    }

    @Override
    public void connectionLost(Throwable throwable) {
        //To change body of implemented methods use File | Settings | File Templates.
    }

    @Override
    public void messageArrived(String topic, MqttMessage mqttMessage) throws Exception {
        Log.i(TAG, "MessageArrived\nTopic:" + topic+"\nPayload:\n\t"+new String(mqttMessage.getPayload()));
        String payload = new String(mqttMessage.getPayload());
        payload = payload.substring(payload.indexOf("\n\n") + 2);
        
        if(MqttModule.eventsMap.containsKey("onNotification")){
        	KrollFunction kf = MqttModule.eventsMap.get("onNotification");
        	Object[] arr = {payload};
        	kf.callAsync(MqttModule.getInstance().getKrollObject(), arr);
        }
        	
        //DEBUG notifica
//        Intent i = new Intent("anotifica");
//        i.putExtra("TOPIC", topic);
//        i.putExtra("PAYLOAD", new String(mqttMessage.getPayload()));
//        ctx.sendBroadcast(i);
    }

    @Override
    public void deliveryComplete(IMqttDeliveryToken iMqttDeliveryToken) {
    }
}

