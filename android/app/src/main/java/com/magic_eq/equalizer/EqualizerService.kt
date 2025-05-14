package com.magic_eq.equalizer

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.media.audiofx.Equalizer
import android.os.Binder
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.magic_eq.R

class EqualizerService : Service() {
    private var equalizer: Equalizer? = null
    private var enabled = false
    private val TAG = "EqualizerService"
    private val NOTIFICATION_ID = 1001
    private val CHANNEL_ID = "EqualizerServiceChannel"
    
    // Binder to interact with the service
    private val binder = EqualizerBinder()
    
    inner class EqualizerBinder : Binder() {
        fun getService(): EqualizerService = this@EqualizerService
    }
    
    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "Service created")
        
        // Create notification channel for API 26+
        createNotificationChannel()
        
        // Start foreground service with notification
        startForeground(NOTIFICATION_ID, createNotification())
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Initialize equalizer with default session ID (0 for global output mix)
        initializeEqualizer(0)
        
        return START_STICKY // Service will be restarted if system kills it
    }
    
    override fun onBind(intent: Intent?): IBinder {
        return binder
    }
    
    override fun onDestroy() {
        Log.d(TAG, "Service destroyed")
        releaseEqualizer()
        super.onDestroy()
    }
    
    fun initializeEqualizer(audioSessionId: Int): Boolean {
        try {
            // Release any existing equalizer
            releaseEqualizer()
            
            // Create a new equalizer
            Log.d(TAG, "Initializing equalizer with session ID: $audioSessionId")
            equalizer = Equalizer(0, audioSessionId)
            enabled = true
            equalizer?.enabled = true
            
            return true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize equalizer: ${e.message}")
            // Try with default audio session if specific one fails
            if (audioSessionId != 0) {
                try {
                    Log.d(TAG, "Trying with default audio session (0)")
                    equalizer = Equalizer(0, 0)
                    enabled = true
                    equalizer?.enabled = true
                    return true
                } catch (e2: Exception) {
                    Log.e(TAG, "Failed to initialize equalizer with default session: ${e2.message}")
                }
            }
            return false
        }
    }
    
    fun setEnabled(enabled: Boolean): Boolean {
        try {
            equalizer?.enabled = enabled
            this.enabled = enabled
            return true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to set enabled state: ${e.message}")
            return false
        }
    }
    
    fun isEnabled(): Boolean {
        return equalizer?.enabled ?: false
    }
    
    fun getNumberOfBands(): Int {
        return equalizer?.numberOfBands?.toInt() ?: 0
    }
    
    fun getBandFreqRange(band: Int): IntArray? {
        return try {
            equalizer?.getBandFreqRange(band.toShort())?.map { it.toInt() }?.toIntArray()
        } catch (e: Exception) {
            null
        }
    }
    
    fun getCenterFreq(band: Int): Int {
        return equalizer?.getCenterFreq(band.toShort())?.toInt() ?: 0
    }
    
    fun getBandLevel(band: Int): Int {
        return equalizer?.getBandLevel(band.toShort())?.toInt() ?: 0
    }
    
    fun setBandLevel(band: Int, level: Int): Boolean {
        try {
            equalizer?.setBandLevel(band.toShort(), level.toShort())
            return true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to set band level: ${e.message}")
            return false
        }
    }
    
    fun getBandLevelRange(): IntArray? {
        return equalizer?.bandLevelRange?.map { it.toInt() }?.toIntArray()
    }
    
    fun getNumberOfPresets(): Int {
        return equalizer?.numberOfPresets?.toInt() ?: 0
    }
    
    fun getPresetName(preset: Int): String {
        return equalizer?.getPresetName(preset.toShort()) ?: ""
    }
    
    fun usePreset(preset: Int): Boolean {
        try {
            equalizer?.usePreset(preset.toShort())
            return true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to use preset: ${e.message}")
            return false
        }
    }
    
    fun getCurrentPreset(): Int {
        return equalizer?.currentPreset?.toInt() ?: -1
    }
    
    private fun releaseEqualizer() {
        equalizer?.release()
        equalizer = null
        enabled = false
    }
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "Equalizer Service"
            val descriptionText = "Background service to maintain equalizer settings"
            val importance = NotificationManager.IMPORTANCE_LOW
            val channel = NotificationChannel(CHANNEL_ID, name, importance).apply {
                description = descriptionText
            }
            
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }
    
    private fun createNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Audio Equalizer")
            .setContentText("Equalizer is running in the background")
            .setSmallIcon(R.drawable.ic_notification)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }
} 