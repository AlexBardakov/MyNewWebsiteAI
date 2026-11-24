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
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.material3.MaterialTheme
import kotlinx.coroutines.launch
import ru.fourkings.admin.data.Api
import ru.fourkings.admin.data.Prefs
import ru.fourkings.admin.notify.Notifier
import ru.fourkings.admin.ui.CertificateScreen
import ru.fourkings.admin.ui.FourKingsTheme
import ru.fourkings.admin.ui.LoginScreen
import ru.fourkings.admin.ui.OrderScreen
import ru.fourkings.admin.ui.OrdersScreen
import ru.fourkings.admin.work.PollScheduler

/** Экраны приложения (простой стек без библиотек навигации). */
sealed interface Screen {
    data object Orders : Screen
    data class Order(val id: String) : Screen
    data class Certificate(val id: String) : Screen
}

class MainActivity : ComponentActivity() {
    private lateinit var prefs: Prefs
    private var token by mutableStateOf<String?>(null)
    private val stack = mutableStateListOf<Screen>(Screen.Orders)

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        prefs = Prefs(this)
        token = prefs.token
        openFromNotification(intent)

        setContent {
            FourKingsTheme {
                Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                    val scope = rememberCoroutineScope()
                    val permission = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { }
                    val t = token

                    if (t == null) {
                        LoginScreen(onLoggedIn = { r ->
                            prefs.token = r.token
                            prefs.cursor = r.cursor // старые заказы уведомлениями не присылаем
                            token = r.token
                            PollScheduler.schedule(this@MainActivity)
                        })
                    } else {
                        // Android 13+: разрешение на уведомления спрашиваем сразу после входа.
                        LaunchedEffect(t) {
                            if (Build.VERSION.SDK_INT >= 33 && !Notifier.canNotify(this@MainActivity)) {
                                permission.launch(Manifest.permission.POST_NOTIFICATIONS)
                            }
                        }
                        BackHandler(enabled = stack.size > 1) { stack.removeAt(stack.lastIndex) }

                        val onUnauthorized = { signOut(remote = false) }
                        when (val s = stack.last()) {
                            Screen.Orders -> OrdersScreen(
                                token = t,
                                onOpenOrder = { stack.add(Screen.Order(it)) },
                                onUnauthorized = onUnauthorized,
                                onLogout = { scope.launch { runCatching { Api.logout(t) }; signOut(remote = true) } },
                            )
                            is Screen.Order -> OrderScreen(t, s.id, onBack = { stack.removeAt(stack.lastIndex) }, onUnauthorized = onUnauthorized)
                            is Screen.Certificate -> CertificateScreen(t, s.id, onBack = { stack.removeAt(stack.lastIndex) }, onUnauthorized = onUnauthorized)
                        }
                    }
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        openFromNotification(intent)
    }

    /** Нажатие на уведомление: сразу открыть нужный заказ/сертификат поверх списка. */
    private fun openFromNotification(intent: Intent?) {
        val id = intent?.getStringExtra(Notifier.EXTRA_ENTITY_ID) ?: return
        val screen = when (intent.getStringExtra(Notifier.EXTRA_TYPE)) {
            "order.created" -> Screen.Order(id)
            "certificate.created" -> Screen.Certificate(id)
            else -> return
        }
        stack.clear(); stack.add(Screen.Orders); stack.add(screen)
        intent.removeExtra(Notifier.EXTRA_ENTITY_ID) // не открывать повторно при повороте экрана
    }

    private fun signOut(@Suppress("UNUSED_PARAMETER") remote: Boolean) {
        prefs.clearSession()
        PollScheduler.cancel(this)
        stack.clear(); stack.add(Screen.Orders)
        token = null
    }
}
