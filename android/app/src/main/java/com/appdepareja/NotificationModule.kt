package com.appdepareja

import android.content.Context
import android.content.Intent
import android.provider.Settings
import com.facebook.react.bridge.*

/**
 * NotificationModule — expone al JavaScript:
 *  - isNotificationListenerEnabled()  → Promise<boolean>
 *  - openNotificationListenerSettings()
 *  - configureSync(coupleId, role)
 *  - clearSync()
 *  - addListener(eventName)           (requerido por NativeEventEmitter)
 *  - removeListeners(count)           (requerido por NativeEventEmitter)
 */
class NotificationModule(reactContext: ReactApplicationContext)
    : ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "NotificationModule"

    override fun initialize() {
        super.initialize()
        NotificationService.reactContext = reactApplicationContext
    }

    override fun invalidate() {
        super.invalidate()
        NotificationService.reactContext = null
    }

    @ReactMethod
    fun isNotificationListenerEnabled(promise: Promise) {
        try {
            val packageName = reactApplicationContext.packageName
            val flat = Settings.Secure.getString(
                reactApplicationContext.contentResolver,
                "enabled_notification_listeners"
            ) ?: ""
            val enabled = flat.split(":").any { it.contains(packageName) }
            promise.resolve(enabled)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun openNotificationListenerSettings() {
        try {
            val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            reactApplicationContext.startActivity(intent)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    @ReactMethod
    fun configureSync(coupleId: String, role: String) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences("complices_sync_prefs", Context.MODE_PRIVATE)
            prefs.edit()
                .putString("couple_id", coupleId)
                .putString("role", role)
                .apply()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    @ReactMethod
    fun clearSync() {
        try {
            val prefs = reactApplicationContext.getSharedPreferences("complices_sync_prefs", Context.MODE_PRIVATE)
            prefs.edit().clear().apply()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    @ReactMethod
    fun addListener(type: String?) {
        // Requerido por React Native NativeEventEmitter
    }

    @ReactMethod
    fun removeListeners(count: Int?) {
        // Requerido por React Native NativeEventEmitter
    }
}
