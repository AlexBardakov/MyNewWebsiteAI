package ru.fourkings.admin.work

import android.content.Context
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import ru.fourkings.admin.data.Api
import ru.fourkings.admin.data.ApiException
import ru.fourkings.admin.data.Prefs
import ru.fourkings.admin.notify.Notifier
import java.util.concurrent.TimeUnit

/**
 * Опрос сайта: «какие события появились после последнего показанного?»
 * (GET /api/app/events?after=cursor). Для каждого нового — уведомление.
 *
 * Как в приложении МерчКит.Карты: без Firebase и сторонних служб — телефон сам спрашивает
 * наш сервер. Раз в 15 минут (минимум, который Android разрешает для фоновой работы)
 * и каждый раз при открытии приложения.
 */
object Poller {
    private val mutex = Mutex() // фоновый опрос и опрос при открытии не должны идти одновременно

    /** Возвращает количество новых событий. Бросает ApiException (401 — ключ отозван). */
    suspend fun poll(context: Context): Int = mutex.withLock {
        val prefs = Prefs(context)
        val token = prefs.token ?: return 0
        var total = 0
        repeat(20) { // не больше 1000 событий за раз — с запасом
            val r = Api.events(token, prefs.cursor)
            r.events.forEach { Notifier.showEvent(context, it) }
            prefs.cursor = r.cursor
            total += r.events.size
            if (r.events.size < 50) return total
        }
        total
    }
}

class PollWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        val prefs = Prefs(applicationContext)
        if (prefs.token == null) return Result.success()
        return try {
            Poller.poll(applicationContext)
            Result.success()
        } catch (e: ApiException) {
            if (e.code == 401) {
                // Устройство отключили в веб-админке — выходим и просим войти заново.
                prefs.clearSession()
                Notifier.showLoginRequired(applicationContext)
                PollScheduler.cancel(applicationContext)
                Result.success()
            } else {
                Result.retry() // нет сети или сайт недоступен — WorkManager повторит позже
            }
        }
    }
}

object PollScheduler {
    private const val WORK_NAME = "poll-events"

    fun schedule(context: Context) {
        val request = PeriodicWorkRequestBuilder<PollWorker>(15, TimeUnit.MINUTES)
            .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
            .build()
        WorkManager.getInstance(context)
            .enqueueUniquePeriodicWork(WORK_NAME, ExistingPeriodicWorkPolicy.KEEP, request)
    }

    fun cancel(context: Context) {
        WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME)
    }
}
