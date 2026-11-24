package ru.fourkings.admin.ui

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import android.content.Context
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import ru.fourkings.admin.data.Api
import ru.fourkings.admin.data.ApiException
import ru.fourkings.admin.data.Category
import ru.fourkings.admin.data.Prefs
import ru.fourkings.admin.data.ProductStock

/**
 * Данные экрана «Остатки» и сохранение изменений.
 *
 * Живёт на уровне процесса приложения (StockHolder), а не экрана: сохранение не теряется,
 * если сразу после «+» переключиться на «Заказы», повернуть телефон или сменить тему. Нажатия «−/+» копятся 0,7 с и уходят
 * на сайт одним запросом (быстрые 5 нажатий = 1 запрос). При сворачивании приложения
 * всё несохранённое отправляется сразу (flushAll).
 */
class StockState(
    private val scope: CoroutineScope,
    private val token: () -> String?,
) {
    /** Что делать, если ключ устройства отозван (назначает текущий экран). */
    var onUnauthorized: () -> Unit = {}
    /** Сообщение об ошибке сохранения: (текст, повторить). Назначает текущий экран. */
    var onSaveError: (String, () -> Unit) -> Unit = { _, _ -> }

    val categories = mutableStateListOf<Category>()
    val products = mutableStateListOf<ProductStock>()

    /** Значения, которые пользователь уже выставил, но сайт ещё не подтвердил. */
    val pending = mutableStateMapOf<String, Int>()
    /** Товары, по которым сейчас идёт запрос. */
    val saving = mutableStateMapOf<String, Boolean>()
    /** Товары, которые не удалось сохранить (показываем «не сохранено»). */
    val failed = mutableStateMapOf<String, Boolean>()

    var loading by mutableStateOf(false); private set
    var loadedOnce by mutableStateOf(false); private set
    var loadError by mutableStateOf<String?>(null); private set

    private val timers = mutableMapOf<String, Job>()

    fun valueOf(p: ProductStock): Int = pending[p.id] ?: p.remainder

    fun load() {
        val t = token() ?: return
        if (loading) return
        scope.launch {
            loading = true
            try {
                val r = Api.products(t)
                categories.clear(); categories.addAll(r.categories)
                // Не затираем то, что пользователь только что поменял и ещё не сохранилось.
                products.clear(); products.addAll(r.products)
                loadError = null
                loadedOnce = true
            } catch (e: ApiException) {
                if (e.code == 401) onUnauthorized() else loadError = e.message
            } finally {
                loading = false
            }
        }
    }

    /** Новое значение остатка (из «−/+» или ввода числа). */
    fun change(productId: String, value: Int) {
        val v = value.coerceIn(0, 100_000)
        pending[productId] = v
        failed.remove(productId)
        timers[productId]?.cancel()
        timers[productId] = scope.launch {
            delay(700)
            save(productId)
        }
    }

    /** Отправить всё несохранённое прямо сейчас (при сворачивании приложения). */
    fun flushAll() {
        for (id in pending.keys.toList()) {
            timers[id]?.cancel()
            timers[id] = scope.launch { save(id) }
        }
    }

    private suspend fun save(productId: String) {
        val t = token() ?: return
        val v = pending[productId] ?: return
        saving[productId] = true
        try {
            val updated = Api.setRemainder(t, productId, v)
            val i = products.indexOfFirst { it.id == productId }
            if (i >= 0) products[i] = updated
            // Если пока шёл запрос, значение поменяли ещё раз — его отправит следующий таймер.
            if (pending[productId] == v) pending.remove(productId)
        } catch (e: ApiException) {
            if (e.code == 401) {
                onUnauthorized()
            } else {
                failed[productId] = true
                val name = products.firstOrNull { it.id == productId }?.name ?: "товар"
                onSaveError("Не сохранилось: «$name». ${e.message}") { change(productId, v) }
            }
        } finally {
            saving.remove(productId)
        }
    }
}

/** Один StockState на всё приложение: переживает поворот экрана и смену темы. */
object StockHolder {
    private val appScope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private var state: StockState? = null

    fun get(context: Context): StockState =
        state ?: StockState(appScope) { Prefs(context.applicationContext).token }.also { state = it }

    /** При выходе из аккаунта — забыть данные прошлого входа. */
    fun clear() { state = null }
}
