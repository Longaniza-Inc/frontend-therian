package com.longanizainc.pawtalk

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class MyFirebaseMessagingService : FirebaseMessagingService() {

    companion object {
        private const val TAG = "PawTalkFCM"
        private const val CHANNEL_ID = "pawtalk_notifications"
        private const val CHANNEL_NAME = "PawTalk Notificaciones"
    }

    /**
     * Se llama cuando se genera o actualiza el token FCM del dispositivo.
     * El token se enviará al backend desde el frontend (Capacitor/JS)
     * cuando el usuario inicie sesión.
     */
    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "Nuevo FCM token: $token")
    }

    /**
     * Se llama cuando la app recibe un mensaje FCM estando en primer plano.
     * Si la app está en segundo plano/cerrada, el sistema muestra la notificación automáticamente.
     */
    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        Log.d(TAG, "Mensaje recibido de: ${remoteMessage.from}")

        var title = ""
        var body = ""
        var deepLink: String? = null

        // Payload de notificación
        remoteMessage.notification?.let {
            title = it.title ?: "PawTalk"
            body = it.body ?: ""
            Log.d(TAG, "Notificación - Título: $title, Body: $body")
        }

        // Payload de datos personalizados
        if (remoteMessage.data.isNotEmpty()) {
            Log.d(TAG, "Data payload: ${remoteMessage.data}")
            deepLink = remoteMessage.data["deepLink"]

            if (title.isEmpty()) {
                title = remoteMessage.data["title"] ?: "PawTalk"
            }
            if (body.isEmpty()) {
                body = remoteMessage.data["body"] ?: ""
            }
        }

        // Mostrar notificación local cuando la app está en primer plano
        showNotification(title, body, deepLink)
    }

    /**
     * Construye y muestra una notificación local.
     * Si hay deepLink, al hacer click abre la app en esa sección.
     */
    private fun showNotification(title: String, body: String, deepLink: String?) {
        createNotificationChannel()

        // Intent: si hay deep link, abrir la app con ese link
        val intent = if (!deepLink.isNullOrEmpty()) {
            Intent(Intent.ACTION_VIEW, Uri.parse(deepLink))
        } else {
            Intent(this, MainActivity::class.java)
        }.apply {
            addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        }

        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info) // Cambiar por tu icono
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)
            .build()

        val manager = getSystemService(NOTIFICATION_SERVICE) as? NotificationManager
        manager?.notify(body.hashCode(), notification)
    }

    /**
     * Crea el canal de notificaciones (obligatorio para Android 8.0 Oreo+).
     */
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notificaciones de mensajes y matches de PawTalk"
                enableVibration(true)
            }

            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }
}
