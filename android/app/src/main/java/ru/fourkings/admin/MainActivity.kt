package ru.fourkings.admin

import android.Manifest
import android.content.Intent
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.WindowInsetsSides
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.only
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.SnackbarDuration
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.SnackbarResult
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LifecycleEventEffect
import kotlinx.coroutines.launch
import ru.fourkings.admin.data.Api
import ru.fourkings.admin.data.Prefs
import ru.fourkings.admin.notify.Notifier
import ru.fourkings.admin.ui.AppIcons
import ru.fourkings.admin.ui.CertificateScreen
import ru.fourkings.admin.ui.FourKingsTheme
import ru.fourkings.admin.ui.LoginScreen
import ru.fourkings.admin.ui.OrderScreen
import ru.fourkings.admin.ui.OrdersScreen
import ru.fourkings.admin.ui.StockScreen
import ru.fourkings.admin.ui.StockHolder
import ru.fourkings.admin.work.PollScheduler

/** Карточки, открытые поверх вкладок. */
sealed interface Detail {
    data class Order(val id: String) : Detail
    data class Certificate(val id: String) : Detail
}

enum class Tab { Orders, Stock }

class MainActivity : ComponentActivity() {
    private lateinit var prefs: Prefs
    private var token by mutableStateOf<String?>(null)
    private var tab by mutableStateOf(Tab.Orders)
    private val details = mutableStateListOf<Detail>()

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        prefs = Prefs(this)
        token = prefs.token
        savedInstanceState?.let { restoreState(it) } ?: openFromNotification(intent)

        setContent {
            FourKingsTheme {
                Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                    val t = token
                    if (t == null) {
                        LoginScreen(onLoggedIn = { r ->
                            prefs.token = r.token
                            prefs.cursor = r.cursor // старые заказы уведомлениями не присылаем
                            token = r.token
                            PollScheduler.schedule(this@MainActivity)
                        })
                    } else {
                        AdminApp(t)
                    }
                }
            }
        }
    }

    @Composable
    private fun AdminApp(t: String) {
        val scope = rememberCoroutineScope()
        val ordersSnackbar = remember { SnackbarHostState() }
        val stockSnackbar = remember { SnackbarHostState() }
        var newCount by rememberSaveable { mutableIntStateOf(0) }
        val permission = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { }

        val stock = remember(t) { StockHolder.get(applicationContext) }
        DisposableEffect(stock) {
            stock.onUnauthorized = { signOut() }
            stock.onSaveError = { msg, retry ->
                scope.launch {
                    val r = stockSnackbar.showSnackbar(msg, actionLabel = "Повторить", duration = SnackbarDuration.Long)
                    if (r == SnackbarResult.ActionPerformed) retry()
                }
            }
            onDispose { stock.onUnauthorized = {}; stock.onSaveError = { _, _ -> } }
        }

        // Android 13+: разрешение на уведомления спрашиваем сразу после входа.
        LaunchedEffect(t) {
            if (Build.VERSION.SDK_INT >= 33 && !Notifier.canNotify(this@MainActivity)) {
                permission.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
        // Свернули приложение — сразу отправляем несохранённые остатки.
        LifecycleEventEffect(Lifecycle.Event.ON_PAUSE) { stock.flushAll() }

        BackHandler(enabled = details.isNotEmpty()) { details.removeAt(details.lastIndex) }
        BackHandler(enabled = details.isEmpty() && tab != Tab.Orders) { tab = Tab.Orders }

        val detail = details.lastOrNull()
        if (detail != null) {
            when (detail) {
                is Detail.Order -> OrderScreen(t, detail.id, onBack = { details.removeAt(details.lastIndex) }, onUnauthorized = ::signOut)
                is Detail.Certificate -> CertificateScreen(t, detail.id, onBack = { details.removeAt(details.lastIndex) }, onUnauthorized = ::signOut)
            }
            return
        }

        val logout: () -> Unit = { scope.launch { runCatching { Api.logout(t) }; signOut() } }
        // Нижнее меню само учитывает системную панель навигации, поэтому экранам — только верх и бока.
        val tabInsets = WindowInsets.safeDrawing.only(WindowInsetsSides.Top + WindowInsetsSides.Horizontal)

        Column(Modifier.fillMaxSize()) {
            Box(Modifier.weight(1f)) {
                when (tab) {
                    Tab.Orders -> OrdersScreen(
                        token = t,
                        snackbar = ordersSnackbar,
                        contentInsets = tabInsets,
                        onOpenOrder = { details.add(Detail.Order(it)) },
                        onNewCount = { newCount = it },
                        onUnauthorized = ::signOut,
                        onLogout = logout,
                    )
                    Tab.Stock -> StockScreen(stock, stockSnackbar, tabInsets, onLogout = logout)
                }
            }
            NavigationBar(containerColor = MaterialTheme.colorScheme.surface) {
                NavigationBarItem(
                    selected = tab == Tab.Orders,
                    onClick = { tab = Tab.Orders },
                    icon = {
                        BadgedBox(badge = { if (newCount > 0) Badge { Text(newCount.toString()) } }) {
                            Icon(AppIcons.Orders, contentDescription = null)
                        }
                    },
                    label = { Text("Заказы") },
                )
                NavigationBarItem(
                    selected = tab == Tab.Stock,
                    onClick = { tab = Tab.Stock },
                    icon = { Icon(AppIcons.Stock, contentDescription = null) },
                    label = { Text("Остатки") },
                )
            }
        }
    }

    // Поворот экрана / смена темы пересоздают окно — возвращаем вкладку и открытую карточку.
    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        outState.putString("tab", tab.name)
        when (val d = details.lastOrNull()) {
            is Detail.Order -> { outState.putString("detail", "order"); outState.putString("detailId", d.id) }
            is Detail.Certificate -> { outState.putString("detail", "cert"); outState.putString("detailId", d.id) }
            null -> {}
        }
    }

    private fun restoreState(b: Bundle) {
        tab = runCatching { Tab.valueOf(b.getString("tab") ?: "") }.getOrDefault(Tab.Orders)
        val id = b.getString("detailId") ?: return
        when (b.getString("detail")) {
            "order" -> details.add(Detail.Order(id))
            "cert" -> details.add(Detail.Certificate(id))
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        openFromNotification(intent)
    }

    /** Нажатие на уведомление: открыть нужный заказ/сертификат. */
    private fun openFromNotification(intent: Intent?) {
        val id = intent?.getStringExtra(Notifier.EXTRA_ENTITY_ID) ?: return
        val d = when (intent.getStringExtra(Notifier.EXTRA_TYPE)) {
            "order.created" -> Detail.Order(id)
            "certificate.created" -> Detail.Certificate(id)
            else -> return
        }
        tab = Tab.Orders
        details.clear(); details.add(d)
        intent.removeExtra(Notifier.EXTRA_ENTITY_ID) // не открывать повторно при повороте экрана
    }

    private fun signOut() {
        prefs.clearSession()
        StockHolder.clear()
        PollScheduler.cancel(this)
        details.clear(); tab = Tab.Orders
        token = null
    }
}
