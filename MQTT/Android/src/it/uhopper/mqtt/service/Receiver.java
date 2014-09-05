package it.uhopper.mqtt.service;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.net.NetworkInfo;
import android.util.Log;

public class Receiver extends BroadcastReceiver {
    public Receiver() {
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        String s = intent.getAction();
        if (s.equals("android.net.wifi.STATE_CHANGE")) {
            handleNetUpdate(context,intent);
        }
    }


    private void handleNetUpdate(Context context, Intent intent) {
        NetworkInfo netInfo = (NetworkInfo) intent.getExtras().get("networkInfo");

        Log.i("Receiver", "Received Network Update: connected = " + netInfo.isConnected());
        Intent i = new Intent(context, MqttService.class);
        i.setAction(MqttConstants.NETUPDATE);

        i.putExtra("connected", netInfo.isConnected());

        Log.i("TAG", "Notify the service");
        context.startService(i);
    }

}
