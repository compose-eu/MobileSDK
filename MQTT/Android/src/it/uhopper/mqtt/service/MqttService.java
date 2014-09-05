package it.uhopper.mqtt.service;

import android.app.Service;
import android.content.Intent;
import android.net.ConnectivityManager;
import android.net.NetworkInfo; 
import android.os.IBinder; 
import android.os.SystemClock;
import android.util.Log;

import org.eclipse.paho.client.mqttv3.MqttException;

import java.util.Timer;
 


public class MqttService extends Service {
    public final static String TAG = MqttService.class.getSimpleName();


    MqttTask task;


    PingTimerTask timerTask;
    Timer timer;


    @Override
    public void onCreate() {
        super.onCreate();    //To change body of overridden methods use File | Settings | File Templates.
    }


    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {

        if (intent == null || intent.getAction() == null) {
            Log.e(TAG, "Null INTENT ACTION");
            return START_REDELIVER_INTENT;
        }

        String s = intent.getAction();
        //Is service ready ?
        if (!s.equals(MqttConstants.START) && serviceNotReady(intent)) {
            Log.e(TAG, "Starting the service before doing other things");
            return START_STICKY;
        }

        if (s.equals(MqttConstants.NETUPDATE)) {
            Log.i(TAG, "NetUpdate");

            return connectionUpdate(intent);

        } else if (s.equals(MqttConstants.START)) {
            Log.i(TAG, "START");

            return _startService(intent);

        } else if (s.equals(MqttConstants.PUBLISH)) {
            Log.i(TAG, "publish");

            return publish(intent);

        } else if (s.equals(MqttConstants.STOP)) {
            Log.i(TAG, "STOP");
            //TODO stop pingtimer

        } else if (s.equals(MqttConstants.SUBSCRIBE)) {
            Log.i(TAG, "SUBSCRIBE");
            return subscribeToTopic(intent);

        } else if (s.equals(MqttConstants.UNSUBSCRIBE)) {
            Log.i(TAG, "UNSUSCRIBE");
            return unsubscribeToTopic(intent);
        } else if (s.equals(MqttConstants.PING)) {
            Log.i(TAG, "PING");
            return handlePing(intent);
        }

        Log.e(TAG, "Wrong intent action!");

        return START_REDELIVER_INTENT;
    }


    private int _startService(Intent intent) {
        Log.i(TAG, "++++++++++++++++++++++Starting service+++++++++++++++++++++");


        String[] topics = intent.getStringArrayExtra("TOPICS");
        if (topics == null) {
            topics = new String[0];
        }

        int[] qos = intent.getIntArrayExtra("QOS");
        if (qos == null) {
            qos = new int[0];
        }


        MqttCallbackImplementation callback = new MqttCallbackImplementation(this);

        task = new MqttTask(this, topics, qos, callback);

        Thread t = new Thread(task);
        t.start();


        //Start pingtimer
        Log.i(TAG, "Starting timer");
        timer = new Timer();
        timerTask = new PingTimerTask(this);
        timer.schedule(timerTask, MqttConstants.PING_PERIOD, MqttConstants.PING_PERIOD);

        return START_REDELIVER_INTENT;
    }


    private int publish(Intent intent) {
        String topic = intent.getStringExtra("TOPIC");
        String payload = intent.getStringExtra("PAYLOAD");
        int qos = intent.getIntExtra("QOS", 0);
        boolean retain = intent.getBooleanExtra("RETAIN", false);

        if (topic == null) {
            Log.e(TAG, "Missing Topic!");
            return START_REDELIVER_INTENT;
        }

        if (payload == null) {
            payload = "";
        }

        boolean succeded = task.publish(topic, payload, qos, retain);
        Log.d(TAG, "service publish data: " + succeded);

        if (!succeded) {
            //TODO maybe reinitialize the task and try again
        }

        return START_REDELIVER_INTENT;
    }


    private int connectionUpdate(Intent intent) {


        if (task == null || !intent.getBooleanExtra("connected", false)) {
            if (task == null)
                Log.e(TAG, "Received net update, but service is not initialized yet");
            else
                Log.i(TAG, "Received net down update");
        } else {

            Log.i(TAG, "Received a net up update");

            Log.i(TAG, "Getting server location");
            try {
                String host = MqttConstants.HOST;
                task.host = host;
            } catch (Exception e) {

            }
            Log.i(TAG, "Reinitializing mqttTask");

            Thread t = new Thread(task);
            t.start();
            Log.i(TAG, "End of connectionUpdate");
        }
        return START_REDELIVER_INTENT;
    }

    private int subscribeToTopic(Intent intent) {
        String topic = intent.getStringExtra("TOPIC");

        int qos = intent.getIntExtra("QOS", 0);


        if (topic == null) {
            Log.e(TAG, "Missing Topic!");
            return START_STICKY;
        }

        try {
            task.addSubscription(topic, qos);
        } catch (MqttException e) {
            e.printStackTrace();
        }

        return START_STICKY;
    }

    private int unsubscribeToTopic(Intent intent) {
        String topic = intent.getStringExtra("TOPIC");

        if (topic == null) {
            Log.e(TAG, "Missing Topic!");
            return START_STICKY;
        }

        try {
            task.removeSubscription(topic);
        } catch (MqttException e) {
            e.printStackTrace();
        }
        return START_STICKY;
    }


    private int handlePing(Intent intent) {

        Log.i(TAG, "Topics: " + task.subscriptions());


        if (task.isAlreadyConnected()) {
            Log.i(TAG, "Still Connected!");
        } else {
            Log.e(TAG, "Not connected!!");

            ConnectivityManager cm = (ConnectivityManager) getSystemService(CONNECTIVITY_SERVICE);

            NetworkInfo info = cm.getActiveNetworkInfo();
            boolean connected = info != null && info.isConnected();

            if (connected) {
                Log.e(TAG, "but net is still ok");
                Log.i(TAG, "try to reconnect");

                Intent i = new Intent(this, MqttService.class);
                i.setAction(MqttConstants.NETUPDATE);

                i.putExtra("connected", true);

                Log.i("TAG", "Notify the service");
                startService(i);
            } else {
                Log.e(TAG, "and no net :(");
            }

        }

        return START_STICKY;
    }


    private boolean serviceNotReady(final Intent intent) {
        try {
            task.isAlreadyConnected();

            if (task.isInitialized() || intent.getAction().equals(MqttConstants.PING)) // TODO check
                return false;
            else { // If task not initialized still

                new Thread(new Runnable() {
                    @Override
                    public void run() {
                        SystemClock.sleep(10000);
                        startService(intent); //redeliver intent
                    }
                }).start();

                return true;
            }
        } catch (NullPointerException e) {
            Intent i = new Intent(this, MqttService.class);
            i.setAction(MqttConstants.START);
            startService(i);
            startService(intent);// redeliver old intent
            return true;
        }
    }


    public IBinder onBind(Intent intent) {
        return null;
    }
}


