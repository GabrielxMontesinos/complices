package com.appdepareja

import android.content.pm.PackageManager
import android.os.Build
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * NotificationListenerService — intercepta notificaciones del sistema.
 * Debe estar declarado en AndroidManifest.xml con el permiso BIND_NOTIFICATION_LISTENER_SERVICE.
 *
 * Cuando llega una notificación, emite un evento "onNotificationReceived" al JS bridge.
 */
class NotificationService : NotificationListenerService() {

    companion object {
        /** Nombre del evento que escucha el JS bridge */
        const val EVENT_NAME = "onNotificationReceived"

        /** Referencia compartida al ReactContext para emitir eventos */
        var reactContext: ReactContext? = null
    }

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        super.onNotificationPosted(sbn)

        val extras = sbn.notification.extras ?: return
        val ctx = reactContext ?: return

        // Resolver nombre legible del paquete
        val appName = try {
            val pm = applicationContext.packageManager
            val info = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                pm.getApplicationInfo(sbn.packageName, PackageManager.ApplicationInfoFlags.of(0))
            } else {
                @Suppress("DEPRECATION")
                pm.getApplicationInfo(sbn.packageName, 0)
            }
            pm.getApplicationLabel(info).toString()
        } catch (e: PackageManager.NameNotFoundException) {
            sbn.packageName
        }

        val title    = extras.getCharSequence("android.title")?.toString() ?: ""
        val text     = extras.getCharSequence("android.text")?.toString() ?: ""
        val bigText  = extras.getCharSequence("android.bigText")?.toString() ?: ""
        val subText  = extras.getCharSequence("android.subText")?.toString() ?: ""

        // No registrar notificaciones de nuestra propia app
        if (sbn.packageName == applicationContext.packageName) return

        val params = Arguments.createMap().apply {
            putString("appName", appName)
            putString("packageName", sbn.packageName)
            putString("title", title)
            putString("text", text)
            putString("bigText", bigText)
            putString("subText", subText)
            putDouble("receivedAt", sbn.postTime.toDouble())
        }

        ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            ?.emit(EVENT_NAME, params)
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification) {
        // Podría usarse para marcar notificaciones como descartadas en el futuro
    }
}
