package it.uhopper.mqtt.service;

import android.content.Context;
import android.content.Intent;

import java.util.TimerTask;

/**
 * Created by demiurgo on 4/2/14.
 */

public class PingTimerTask extends TimerTask {
    private final static String TAG = PingTimerTask.class.getSimpleName();

    private final Context ctx;

    public PingTimerTask(Context ctx){
        this.ctx = ctx;
    }

    @Override
    public void run() {
        Intent i = new Intent(ctx, MqttService.class);
        i.setAction(MqttConstants.PING);
        ctx.startService(i);
    }
}
