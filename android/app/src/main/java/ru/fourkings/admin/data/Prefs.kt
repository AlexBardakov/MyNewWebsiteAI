package ru.fourkings.admin.data

import android.content.Context
import androidx.core.content.edit

/**
 * Настройки приложения в его закрытом хранилище (другие приложения к нему доступа не имеют;
 * резервное копирование в облако отключено в манифесте — ключ не уедет с телефона).
 *   token  — ключ устройства для API (null — не вошли);
 *   cursor — номер последнего события, о котором уже показано уведомление.
 */
class Prefs(context: Context) {
    private val sp = context.applicationContext.getSharedPreferences("fourkings_admin", Context.MODE_PRIVATE)

    var token: String?
        get() = sp.getString("token", null)
        set(value) = sp.edit { if (value == null) remove("token") else putString("token", value) }

    var cursor: Int
        get() = sp.getInt("cursor", 0)
        set(value) = sp.edit { putInt("cursor", value) }

    fun clearSession() = sp.edit { remove("token"); remove("cursor") }
}
