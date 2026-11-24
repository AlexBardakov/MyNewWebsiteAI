package ru.fourkings.admin.notify

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import ru.fourkings.admin.MainActivity
import ru.fourkings.admin.R
import ru.fourkings.admin.data.AppEvent
import java.time.Instant

/** Уведомления в шторке телефона. */
object Notifier {
    const val CHANNEL_ORDERS = "orders"
    const val CHANNEL_SYSTEM = "system"
    const val EXTRA_TYPE = "event_type"
    const val EXTRA_ENTITY_ID = "entity_id"
    private const val ID_LOGIN_REQUIRED = -1

    fun createChannels(context: Context) {
        val nm = context.getSystemService(NotificationManager::class.java)
        nm.createNotificationChannel(
            NotificationChannel(CHANNEL_ORDERS, "Заказы и сертификаты", NotificationManager.IMPORTANCE_HIGH).apply {
                description = "Новые заказы и подарочные сертификаты с сайта"
                enableVibration(true)
            }
        )
        nm.createNotificationChannel(
            NotificationChannel(CHANNEL_SYSTEM, "Служебные", NotificationManager.IMPORTANCE_DEFAULT).apply {
                description = "Например, когда нужно войти в приложение заново"
            }
        )
    }

    fun canNotify(context: Context): Boolean =
        (Build.VERSION.SDK_INT < 33 ||
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) &&
            NotificationManagerCompat.from(context).areNotificationsEnabled()

    /** Уведомление о событии; нажатие открывает заказ/сертификат в приложении. */
    fun showEvent(context: Context, event: AppEvent) {
        if (!canNotify(context)) return
        val open = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra(EXTRA_TYPE, event.type)
            putExtra(EXTRA_ENTITY_ID, event.entityId)
        }
        val pi = PendingIntent.getActivity(
            context, event.id, open, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        val whenMs = runCatching { Instant.parse(event.createdAt).toEpochMilli() }.getOrDefault(System.currentTimeMillis())
        val n = NotificationCompat.Builder(context, CHANNEL_ORDERS)
            .setSmallIcon(R.drawable.ic_notification)
            .setColor(ContextCompat.getColor(context, R.color.brand_gold))
            .setContentTitle(event.title)
            .setContentText(event.body)
            .setWhen(whenMs)
            .setShowWhen(true)
            .setContentIntent(pi)
            .setAutoCancel(true)
            .setCategory(NotificationCompat.CATEGORY_MESSAGE)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()
        @Suppress("MissingPermission") // проверено в canNotify()
        NotificationManagerCompat.from(context).notify(event.id, n)
    }

    fun showLoginRequired(context: Context) {
        if (!canNotify(context)) return
        val pi = PendingIntent.getActivity(
            context, 0, Intent(context, MainActivity::class.java), PendingIntent.FLAG_IMMUTABLE
        )
        val n = NotificationCompat.Builder(context, CHANNEL_SYSTEM)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("Нужно войти заново")
            .setContentText("Доступ этого телефона отключён. Уведомления о заказах не приходят.")
            .setContentIntent(pi)
            .setAutoCancel(true)
            .build()
        @Suppress("MissingPermission")
        NotificationManagerCompat.from(context).notify(ID_LOGIN_REQUIRED, n)
    }
}
