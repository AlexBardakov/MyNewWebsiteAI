package ru.fourkings.admin

import android.app.Application
import ru.fourkings.admin.data.Prefs
import ru.fourkings.admin.notify.Notifier
import ru.fourkings.admin.work.PollScheduler

class App : Application() {
    override fun onCreate() {
        super.onCreate()
        Notifier.createChannels(this)
        // Если уже вошли — убеждаемся, что фоновый опрос запланирован (например, после обновления приложения).
        if (Prefs(this).token != null) PollScheduler.schedule(this)
    }
}
