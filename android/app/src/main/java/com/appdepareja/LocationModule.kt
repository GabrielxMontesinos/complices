package com.appdepareja

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.BatteryManager
import android.os.Build
import android.os.Bundle
import android.os.Looper
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*

/**
 * LocationModule:
 * Módulo nativo para obtener la ubicación GPS puntual y controlar
 * el Foreground Service de rastreo en segundo plano.
 */
class LocationModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "LocationModule"

    private fun hasLocationPermission(): Boolean {
        val fine = ContextCompat.checkSelfPermission(
            reactApplicationContext,
            android.Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        val coarse = ContextCompat.checkSelfPermission(
            reactApplicationContext,
            android.Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        return fine || coarse
    }

    private fun getBatteryPercentage(): Int {
        return try {
            val batteryFilter = IntentFilter(Intent.ACTION_BATTERY_CHANGED)
            val batteryStatus: Intent? = reactApplicationContext.registerReceiver(null, batteryFilter)
            val level = batteryStatus?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
            val scale = batteryStatus?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
            if (level >= 0 && scale > 0) {
                (level * 100 / scale.toFloat()).toInt()
            } else {
                -1
            }
        } catch (e: Exception) {
            -1
        }
    }

    override fun initialize() {
        super.initialize()
        LocationForegroundService.reactContext = reactApplicationContext
    }

    override fun invalidate() {
        super.invalidate()
        LocationForegroundService.reactContext = null
    }

    @ReactMethod
    fun startLocationService() {
        try {
            if (!hasLocationPermission()) {
                // No intentar iniciar foreground service sin permisos concedidos
                return
            }
            val intent = Intent(reactApplicationContext, LocationForegroundService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactApplicationContext.startForegroundService(intent)
            } else {
                reactApplicationContext.startService(intent)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    @ReactMethod
    fun stopLocationService() {
        try {
            val intent = Intent(reactApplicationContext, LocationForegroundService::class.java)
            reactApplicationContext.stopService(intent)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    @SuppressLint("MissingPermission")
    @ReactMethod
    fun getCurrentLocation(promise: Promise) {
        if (!hasLocationPermission()) {
            promise.resolve(null)
            return
        }

        val locationManager =
            reactApplicationContext.getSystemService(Context.LOCATION_SERVICE) as? LocationManager

        if (locationManager == null) {
            promise.resolve(null)
            return
        }

        try {
            // Intentar primero con la última ubicación conocida (rápida)
            var lastKnown: Location? = null
            if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                lastKnown = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER)
            }
            if (lastKnown == null && locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                lastKnown = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
            }

            if (lastKnown != null && (System.currentTimeMillis() - lastKnown.time) < 60000) {
                // Si la última ubicación tiene menos de 1 minuto, la usamos
                val map = Arguments.createMap().apply {
                    putDouble("latitude", lastKnown.latitude)
                    putDouble("longitude", lastKnown.longitude)
                    putDouble("accuracy", lastKnown.accuracy.toDouble())
                    putDouble("speed", lastKnown.speed.toDouble())
                    putInt("batteryLevel", getBatteryPercentage())
                    putDouble("timestamp", lastKnown.time.toDouble())
                }
                promise.resolve(map)
                return
            }

            // Solicitar actualización puntual
            val provider = if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                LocationManager.GPS_PROVIDER
            } else if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                LocationManager.NETWORK_PROVIDER
            } else {
                LocationManager.PASSIVE_PROVIDER
            }

            val listener = object : LocationListener {
                override fun onLocationChanged(loc: Location) {
                    try {
                        locationManager.removeUpdates(this)
                    } catch (_: Exception) {}
                    val map = Arguments.createMap().apply {
                        putDouble("latitude", loc.latitude)
                        putDouble("longitude", loc.longitude)
                        putDouble("accuracy", loc.accuracy.toDouble())
                        putDouble("speed", loc.speed.toDouble())
                        putInt("batteryLevel", getBatteryPercentage())
                        putDouble("timestamp", loc.time.toDouble())
                    }
                    promise.resolve(map)
                }

                @Deprecated("Deprecated in Java")
                override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
                override fun onProviderEnabled(provider: String) {}
                override fun onProviderDisabled(provider: String) {}
            }

            locationManager.requestSingleUpdate(provider, listener, Looper.getMainLooper())
        } catch (e: Exception) {
            promise.resolve(null)
        }
    }
}
