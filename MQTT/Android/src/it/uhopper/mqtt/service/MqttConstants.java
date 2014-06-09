package it.uhopper.mqtt.service;

 
import android.content.Context;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
 
public class MqttConstants {

    public static final long PING_PERIOD = 60 * 1000;
    public static final String HOST = "tcp://api.servioticy.com";
    public static final String TAG = "MQTT_MODULE";
    // constants used to define MQTT connection status
    public static enum MQTTConnectionStatus {
        INITIAL,                            // initial status
        CONNECTING,                         // attempting to connect
        CONNECTED,                          // connected
        NOTCONNECTED_WAITINGFORINTERNET,    // can't connect because the phone
        //     does not have Internet access
        NOTCONNECTED_USERDISCONNECT,        // user has explicitly requested
        //     disconnection
        NOTCONNECTED_DATADISABLED,          // can't connect because the user
        //     has disabled data access
        NOTCONNECTED_UNKNOWNREASON          // failed to connect for some reason
    }

    //======================================================================================

    public static final String NETUPDATE = "it.uh.mqtt_netupdate";
    public static final String START = "it.uh.mqtt_start";
    public static final String PUBLISH = "it.uh.mqtt_publish";
    public static final String STOP = "it.uh.mqtt_stop";
    public static final String SUBSCRIBE = "it.uh.mqtt_subscribe";
    public static final String UNSUBSCRIBE = "it.uh.mqtt_unsubscribe";
    public static final String PING = "it.uh.mqtt_ping";

    //======================================================================================

 

 
    public static final String getUniqueID(Context ctx) {
        WifiManager manager = (WifiManager) ctx.getSystemService(Context.WIFI_SERVICE);
        WifiInfo info = manager.getConnectionInfo();
        String address = info.getMacAddress();

        return address;
    }




}
