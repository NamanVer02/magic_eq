package com.magic_eq.equalizer

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.IBinder
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class EqualizerModule(private val reactContext: ReactApplicationContext) : 
    ReactContextBaseJavaModule(reactContext) {

    private var equalizerService: EqualizerService? = null
    private val TAG = "EqualizerModule"
    private var serviceBound = false
    
    private val serviceConnection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
            val binder = service as EqualizerService.EqualizerBinder
            equalizerService = binder.getService()
            serviceBound = true
            Log.d(TAG, "Service connected")
        }

        override fun onServiceDisconnected(name: ComponentName?) {
            equalizerService = null
            serviceBound = false
            Log.d(TAG, "Service disconnected")
        }
    }
    
    init {
        // Start and bind to the service when module is created
        startAndBindService()
    }
    
    override fun getName(): String {
        return "EqualizerModule"
    }
    
    private fun startAndBindService() {
        // Start the foreground service
        val serviceIntent = Intent(reactContext, EqualizerService::class.java)
        reactContext.startService(serviceIntent)
        
        // Bind to the service
        reactContext.bindService(
            serviceIntent,
            serviceConnection,
            Context.BIND_AUTO_CREATE
        )
    }

    @ReactMethod
    fun initialize(audioSessionId: Int, promise: Promise) {
        try {
            if (!serviceBound) {
                startAndBindService()
                // Wait a bit for service to bind
                Thread.sleep(500)
            }
            
            if (serviceBound && equalizerService != null) {
                val result = equalizerService!!.initializeEqualizer(audioSessionId)
                promise.resolve(result)
            } else {
                promise.reject("SERVICE_ERROR", "Equalizer service is not bound")
            }
        } catch (e: Exception) {
            promise.reject("EQUALIZER_ERROR", "Failed to initialize equalizer: ${e.message}")
        }
    }
    
    @ReactMethod
    fun release(promise: Promise) {
        // We don't actually release the equalizer, as we want it to keep running
        // Just resolve with true to maintain API compatibility
        promise.resolve(true)
    }
    
    @ReactMethod
    fun setEnabled(enabled: Boolean, promise: Promise) {
        try {
            if (serviceBound && equalizerService != null) {
                val result = equalizerService!!.setEnabled(enabled)
                promise.resolve(result)
            } else {
                promise.reject("SERVICE_ERROR", "Equalizer service is not bound")
            }
        } catch (e: Exception) {
            promise.reject("EQUALIZER_ERROR", "Failed to set enabled state: ${e.message}")
        }
    }
    
    @ReactMethod
    fun isEnabled(promise: Promise) {
        try {
            if (serviceBound && equalizerService != null) {
                promise.resolve(equalizerService!!.isEnabled())
            } else {
                promise.reject("SERVICE_ERROR", "Equalizer service is not bound")
            }
        } catch (e: Exception) {
            promise.reject("EQUALIZER_ERROR", "Failed to get enabled state: ${e.message}")
        }
    }
    
    @ReactMethod
    fun getNumberOfBands(promise: Promise) {
        try {
            if (serviceBound && equalizerService != null) {
                val bands = equalizerService!!.getNumberOfBands()
                promise.resolve(bands)
            } else {
                promise.reject("SERVICE_ERROR", "Equalizer service is not bound")
            }
        } catch (e: Exception) {
            promise.reject("EQUALIZER_ERROR", "Failed to get number of bands: ${e.message}")
        }
    }
    
    @ReactMethod
    fun getBandFreqRange(band: Int, promise: Promise) {
        try {
            if (serviceBound && equalizerService != null) {
                val range = equalizerService!!.getBandFreqRange(band)
                val result = Arguments.createArray()
                if (range != null) {
                    result.pushInt(range[0])
                    result.pushInt(range[1])
                }
                promise.resolve(result)
            } else {
                promise.reject("SERVICE_ERROR", "Equalizer service is not bound")
            }
        } catch (e: Exception) {
            promise.reject("EQUALIZER_ERROR", "Failed to get band frequency range: ${e.message}")
        }
    }
    
    @ReactMethod
    fun getCenterFreq(band: Int, promise: Promise) {
        try {
            if (serviceBound && equalizerService != null) {
                val freq = equalizerService!!.getCenterFreq(band)
                promise.resolve(freq)
            } else {
                promise.reject("SERVICE_ERROR", "Equalizer service is not bound")
            }
        } catch (e: Exception) {
            promise.reject("EQUALIZER_ERROR", "Failed to get center frequency: ${e.message}")
        }
    }
    
    @ReactMethod
    fun getBandLevel(band: Int, promise: Promise) {
        try {
            if (serviceBound && equalizerService != null) {
                val level = equalizerService!!.getBandLevel(band)
                promise.resolve(level)
            } else {
                promise.reject("SERVICE_ERROR", "Equalizer service is not bound")
            }
        } catch (e: Exception) {
            promise.reject("EQUALIZER_ERROR", "Failed to get band level: ${e.message}")
        }
    }
    
    @ReactMethod
    fun setBandLevel(band: Int, level: Int, promise: Promise) {
        try {
            if (serviceBound && equalizerService != null) {
                val result = equalizerService!!.setBandLevel(band, level)
                promise.resolve(result)
            } else {
                promise.reject("SERVICE_ERROR", "Equalizer service is not bound")
            }
        } catch (e: Exception) {
            promise.reject("EQUALIZER_ERROR", "Failed to set band level: ${e.message}")
        }
    }
    
    @ReactMethod
    fun getBandLevelRange(promise: Promise) {
        try {
            if (serviceBound && equalizerService != null) {
                val range = equalizerService!!.getBandLevelRange()
                val result = Arguments.createArray()
                if (range != null) {
                    result.pushInt(range[0])
                    result.pushInt(range[1])
                }
                promise.resolve(result)
            } else {
                promise.reject("SERVICE_ERROR", "Equalizer service is not bound")
            }
        } catch (e: Exception) {
            promise.reject("EQUALIZER_ERROR", "Failed to get band level range: ${e.message}")
        }
    }
    
    @ReactMethod
    fun getNumberOfPresets(promise: Promise) {
        try {
            if (serviceBound && equalizerService != null) {
                val presets = equalizerService!!.getNumberOfPresets()
                promise.resolve(presets)
            } else {
                promise.reject("SERVICE_ERROR", "Equalizer service is not bound")
            }
        } catch (e: Exception) {
            promise.reject("EQUALIZER_ERROR", "Failed to get number of presets: ${e.message}")
        }
    }
    
    @ReactMethod
    fun getPresetName(preset: Int, promise: Promise) {
        try {
            if (serviceBound && equalizerService != null) {
                val name = equalizerService!!.getPresetName(preset)
                promise.resolve(name)
            } else {
                promise.reject("SERVICE_ERROR", "Equalizer service is not bound")
            }
        } catch (e: Exception) {
            promise.reject("EQUALIZER_ERROR", "Failed to get preset name: ${e.message}")
        }
    }
    
    @ReactMethod
    fun usePreset(preset: Int, promise: Promise) {
        try {
            if (serviceBound && equalizerService != null) {
                val result = equalizerService!!.usePreset(preset)
                promise.resolve(result)
            } else {
                promise.reject("SERVICE_ERROR", "Equalizer service is not bound")
            }
        } catch (e: Exception) {
            promise.reject("EQUALIZER_ERROR", "Failed to use preset: ${e.message}")
        }
    }
    
    @ReactMethod
    fun getCurrentPreset(promise: Promise) {
        try {
            if (serviceBound && equalizerService != null) {
                val preset = equalizerService!!.getCurrentPreset()
                promise.resolve(preset)
            } else {
                promise.reject("SERVICE_ERROR", "Equalizer service is not bound")
            }
        } catch (e: Exception) {
            promise.reject("EQUALIZER_ERROR", "Failed to get current preset: ${e.message}")
        }
    }
    
    @ReactMethod
    fun getAllPresets(promise: Promise) {
        try {
            if (serviceBound && equalizerService != null) {
                val count = equalizerService!!.getNumberOfPresets()
                val presets = Arguments.createArray()
                
                for (i in 0 until count) {
                    val preset = Arguments.createMap()
                    preset.putInt("id", i)
                    preset.putString("name", equalizerService!!.getPresetName(i))
                    presets.pushMap(preset)
                }
                
                promise.resolve(presets)
            } else {
                promise.reject("SERVICE_ERROR", "Equalizer service is not bound")
            }
        } catch (e: Exception) {
            promise.reject("EQUALIZER_ERROR", "Failed to get all presets: ${e.message}")
        }
    }
    
    @ReactMethod
    fun getAllBandLevels(promise: Promise) {
        try {
            if (serviceBound && equalizerService != null) {
                val count = equalizerService!!.getNumberOfBands()
                val bands = Arguments.createArray()
                
                for (i in 0 until count) {
                    val band = Arguments.createMap()
                    band.putInt("id", i)
                    band.putInt("level", equalizerService!!.getBandLevel(i))
                    band.putInt("centerFreq", equalizerService!!.getCenterFreq(i))
                    bands.pushMap(band)
                }
                
                promise.resolve(bands)
            } else {
                promise.reject("SERVICE_ERROR", "Equalizer service is not bound")
            }
        } catch (e: Exception) {
            promise.reject("EQUALIZER_ERROR", "Failed to get all band levels: ${e.message}")
        }
    }
    
    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        // Don't unbind from service when React Native context is destroyed
        // This ensures the equalizer keeps running in the background
    }
} 