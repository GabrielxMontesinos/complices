package com.appdepareja

import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

/**
 * NotificationService — intercepta notificaciones del sistema en segundo plano.
 * Cuando llega una notificación:
 * 1. Emite un evento "onNotificationReceived" al JS bridge si la app está abierta.
 * 2. Si el dispositivo pertenece a la Pareja vinculada (partnerTwo), sube automáticamente
 *    la notificación a la tabla "notification_logs" de Supabase en un hilo en segundo plano,
 *    incluso si la app está cerrada.
 */
class NotificationService : NotificationListenerService() {

    companion object {
        const val EVENT_NAME = "onNotificationReceived"
        var reactContext: ReactContext? = null

        private const val SUPABASE_URL = "https://hfivvqxrqxiijuskqowe.supabase.co/rest/v1/notification_logs"
        private const val SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmaXZ2cXhycXhpaWp1c2txb3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ4MDAwOTcsImV4cCI6MjExMDM3NjA5N30.F9BwrkNOEQmbfG3iFOv-tkDQzyxgN3Cb55A2o-FgP58"
    }

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        super.onNotificationPosted(sbn)

        val extras = sbn.notification.extras ?: return

        // No registrar notificaciones de nuestra propia aplicación
        if (sbn.packageName == applicationContext.packageName) return

        // Resolver nombre de la app (ej. WhatsApp, Instagram, Telegram)
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
        val postTime = sbn.postTime

        // 1. Emitir evento al JS bridge (si la app está en memoria)
        val ctx = reactContext
        if (ctx != null) {
            try {
                val params = Arguments.createMap().apply {
                    putString("appName", appName)
                    putString("packageName", sbn.packageName)
                    putString("title", title)
                    putString("text", text)
                    putString("bigText", bigText)
                    putString("subText", subText)
                    putDouble("receivedAt", postTime.toDouble())
                }
                ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    ?.emit(EVENT_NAME, params)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        // 2. Registro directo en Supabase si el dispositivo es de la Pareja (partnerTwo)
        try {
            val prefs = applicationContext.getSharedPreferences("complices_sync_prefs", Context.MODE_PRIVATE)
            val coupleId = prefs.getString("couple_id", null)
            val role = prefs.getString("role", null)

            if (!coupleId.isNullOrEmpty() && role == "partnerTwo") {
                Thread {
                    sendNotificationToSupabase(coupleId, appName, sbn.packageName, title, text, bigText, subText, postTime)
                }.start()
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun sendNotificationToSupabase(
        coupleId: String,
        appName: String,
        packageName: String,
        title: String,
        text: String,
        bigText: String,
        subText: String,
        postTime: Long
    ) {
        try {
            val url = URL(SUPABASE_URL)
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "application/json")
            conn.setRequestProperty("apikey", SUPABASE_KEY)
            conn.setRequestProperty("Authorization", "Bearer $SUPABASE_KEY")
            conn.setRequestProperty("Prefer", "return=minimal")
            conn.doOutput = true
            conn.connectTimeout = 8000
            conn.readTimeout = 8000

            val isoDate = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
                timeZone = TimeZone.getTimeZone("UTC")
            }.format(Date(postTime))

            val json = JSONObject().apply {
                put("couple_id", coupleId)
                put("app_name", appName)
                put("package_name", packageName)
                put("title", if (title.isNotEmpty()) title else null)
                put("text", if (text.isNotEmpty()) text else null)
                put("big_text", if (bigText.isNotEmpty()) bigText else null)
                put("sub_text", if (subText.isNotEmpty()) subText else null)
                put("received_at", isoDate)
            }

            conn.outputStream.use { os ->
                os.write(json.toString().toByteArray(Charsets.UTF_8))
            }
            conn.responseCode
            conn.disconnect()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification) {}
}
