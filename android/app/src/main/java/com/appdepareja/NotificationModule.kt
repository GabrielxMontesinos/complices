package com.appdepareja

import android.content.ComponentName
import android.content.Intent
import android.provider.Settings
import android.text.TextUtils
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * NotificationModule — expone al JavaScript:
 *
 *  - isNotificationListenerEnabled()  → Promise<boolean>
 *  - openNotificationListenerSettings()
 *  - addListener(eventName)           (requerido por NativeEventEmitter)
 *  - removeListeners(count)           (requerido por NativeEventEmitter)
 */
class NotificationModule(reactContext: ReactApplicationContext)
    : ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "NotificationModule"

    // Registrar el contexto en el servicio para que pueda emitir eventos
    override fun initialize() {
        super.initialize()
        NotificationService.reactContext = reactApplicationContext
    }

    override fun invalidate() {
        super.invalidate()
        NotificationService.reactContext = null
    }

    /**
     * Comprueba si el Notification Listener está habilitado en ajustes del sistema.
     */
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

    /**
     * Abre la pantalla de configuración "Acceso a notificaciones" del sistema.
     */
    @ReactMethod
    fun openNotificationListenerSettings() {
        try {
            val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            reactApplicationContext.startActivity(intent)
        } catch (e: Exception) {
            // Fallback: ajustes generales
            val intent = Intent(Settings.ACTION_SETTINGS).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            reactApplicationContext.startActivity(intent)
        }
    }

    // Requerido por NativeEventEmitter en JS
    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}
}
