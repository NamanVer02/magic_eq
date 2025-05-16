package com.magic_eq.mediasession

import android.content.ComponentName
import android.content.Context
import android.media.MediaMetadata
import android.media.session.MediaController
import android.media.session.MediaSessionManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.annotation.RequiresApi
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import org.json.JSONObject

@RequiresApi(Build.VERSION_CODES.LOLLIPOP)
class MediaSessionModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule() {

    private val TAG = "MediaSessionModule"
    private var mediaSessionManager: MediaSessionManager? = null
    private var activeControllers: MutableList<MediaController> = mutableListOf()
    private val handler = Handler(Looper.getMainLooper())
    private var isListening = false
    private val pollingInterval: Long = 2000  // Check every 2 seconds

    private val sessionListener = object : MediaSessionManager.OnActiveSessionsChangedListener {
        override fun onActiveSessionsChanged(controllers: List<MediaController>?) {
            Log.d(TAG, "Active sessions changed: ${controllers?.size ?: 0} controllers")
            controllers?.let {
                updateControllers(it)
            }
        }
    }

    override fun getName(): String = "MediaSessionModule"

    @ReactMethod
    fun startListening() {
        if (isListening) return
        
        try {
            Log.d(TAG, "Starting media session monitoring")
            isListening = true
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                initSessionManager()
                startPolling()
            } else {
                Log.e(TAG, "Media session detection requires API level 21+")
                sendNoMediaEvent()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error starting media session listener", e)
            sendNoMediaEvent()
        }
    }

    @ReactMethod
    fun stopListening() {
        if (!isListening) return
        
        try {
            Log.d(TAG, "Stopping media session monitoring")
            isListening = false
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                mediaSessionManager?.removeOnActiveSessionsChangedListener(sessionListener)
            }
            
            handler.removeCallbacksAndMessages(null)
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping media session listener", e)
        }
    }

    private fun initSessionManager() {
        if (mediaSessionManager != null) return
        
        try {
            val context = reactContext.getSystemService(Context.MEDIA_SESSION_SERVICE) as? MediaSessionManager
            if (context != null) {
                mediaSessionManager = context
                val componentName = ComponentName(reactContext, reactContext.javaClass)
                
                // Get initial active sessions
                val controllers = mediaSessionManager?.getActiveSessions(componentName)
                controllers?.let { updateControllers(it) }
                
                // Listen for changes
                mediaSessionManager?.addOnActiveSessionsChangedListener(sessionListener, componentName)
            } else {
                Log.e(TAG, "Could not get MediaSessionManager")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error initializing MediaSessionManager", e)
        }
    }

    private fun updateControllers(controllers: List<MediaController>) {
        activeControllers.clear()
        activeControllers.addAll(controllers)
        
        checkForActiveMedia()
    }

    private fun startPolling() {
        handler.postDelayed(object : Runnable {
            override fun run() {
                if (isListening) {
                    checkForActiveMedia()
                    handler.postDelayed(this, pollingInterval)
                }
            }
        }, pollingInterval)
    }
    
    private fun checkForActiveMedia() {
        if (activeControllers.isEmpty()) {
            sendNoMediaEvent()
            return
        }
        
        // Find a controller that's currently playing
        val playingController = activeControllers.find { 
            it.playbackState?.state == android.media.session.PlaybackState.STATE_PLAYING 
        } ?: activeControllers.firstOrNull()
        
        playingController?.let {
            sendMediaInfo(it)
        } ?: sendNoMediaEvent()
    }
    
    private fun sendMediaInfo(controller: MediaController) {
        val metadata = controller.metadata ?: return
        val playbackState = controller.playbackState
        val isPlaying = playbackState?.state == android.media.session.PlaybackState.STATE_PLAYING
        
        val mediaInfo = WritableNativeMap().apply {
            putString("title", metadata.getString(MediaMetadata.METADATA_KEY_TITLE) ?: "Unknown Title")
            putString("artist", metadata.getString(MediaMetadata.METADATA_KEY_ARTIST) ?: "Unknown Artist")
            putString("album", metadata.getString(MediaMetadata.METADATA_KEY_ALBUM) ?: "")
            putBoolean("isPlaying", isPlaying)
            putString("packageName", controller.packageName ?: "")
            
            // Handle artwork if available
            val artBitmap = metadata.getBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART)
            if (artBitmap != null) {
                // In a full implementation, you would convert bitmap to a URI
                // For now, we'll skip this as it requires more complex code
                putString("artwork", "")
            } else {
                putString("artwork", "")
            }
        }
        
        sendEvent("onMediaSessionUpdate", mediaInfo)
    }
    
    private fun sendNoMediaEvent() {
        val mediaInfo = WritableNativeMap().apply {
            putNull("title")
            putNull("artist")
            putNull("album")
            putNull("artwork")
            putBoolean("isPlaying", false)
            putNull("packageName")
        }
        
        sendEvent("onMediaSessionUpdate", mediaInfo)
    }
    
    private fun sendEvent(eventName: String, params: WritableMap) {
        reactContext
            .getJSModule(RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }
} 