package ru.fourkings.admin.ui

import android.content.Intent
import android.net.Uri
import android.os.PowerManager
import android.provider.Settings
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.LifecycleResumeEffect
import kotlinx.coroutines.launch
import ru.fourkings.admin.data.Api
import ru.fourkings.admin.data.ApiException
import ru.fourkings.admin.data.OrderListItem
import ru.fourkings.admin.notify.Notifier
import ru.fourkings.admin.work.Poller

private const val PAGE = 30

/** Статусы, которые требуют внимания (фильтр «Активные»). */
private val ACTIVE = setOf("new", "picking", "awaiting_payment", "paid")

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrdersScreen(
    token: String,
    snackbar: SnackbarHostState,
    contentInsets: WindowInsets,
    onOpenOrder: (String) -> Unit,
    onNewCount: (Int) -> Unit,
    onUnauthorized: () -> Unit,
    onLogout: () -> Unit,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val orders = remember { mutableStateListOf<OrderListItem>() }
    var loading by remember { mutableStateOf(false) }
    var userRefresh by remember { mutableStateOf(false) } // индикатор — только когда потянули сами
    var loadedOnce by remember { mutableStateOf(false) }
    var loadingMore by remember { mutableStateOf(false) }
    var hasMore by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var onlyActive by rememberSaveable { mutableStateOf(true) }
    var menu by remember { mutableStateOf(false) }
    var canNotify by remember { mutableStateOf(Notifier.canNotify(context)) }
    var batteryFree by remember { mutableStateOf(isIgnoringBatteryOptimizations(context)) }

    fun handle(e: ApiException) {
        if (e.code == 401) onUnauthorized()
        else if (loadedOnce) scope.launch { snackbar.showSnackbar(e.message) }
        else error = e.message
    }

    fun refresh(byUser: Boolean = false) {
        if (loading) return
        scope.launch {
            loading = true; userRefresh = byUser
            try {
                runCatching { Poller.poll(context) } // уведомления о пришедшем, пока приложение было закрыто
                val page = Api.orders(token, limit = PAGE).orders
                orders.clear(); orders.addAll(page)
                hasMore = page.size == PAGE
                error = null; loadedOnce = true
                onNewCount(page.count { it.status == "new" })
            } catch (e: ApiException) {
                handle(e)
            } finally {
                loading = false; userRefresh = false
            }
        }
    }

    fun loadMore() {
        val last = orders.lastOrNull() ?: return
        if (loadingMore) return
        scope.launch {
            loadingMore = true
            try {
                val page = Api.orders(token, before = last.createdAt, limit = PAGE).orders
                orders.addAll(page); hasMore = page.size == PAGE
            } catch (e: ApiException) {
                handle(e)
            } finally {
                loadingMore = false
            }
        }
    }

    // При каждом возвращении в приложение — тихо обновляем список и проверяем разрешения.
    LifecycleResumeEffect(Unit) {
        canNotify = Notifier.canNotify(context)
        batteryFree = isIgnoringBatteryOptimizations(context)
        refresh()
        onPauseOrDispose { }
    }

    val visible = if (onlyActive) orders.filter { it.status in ACTIVE } else orders

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Заказы") },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background),
                actions = {
                    Box {
                        TextButton(onClick = { menu = true }) { Text("•••") }
                        DropdownMenu(expanded = menu, onDismissRequest = { menu = false }) {
                            DropdownMenuItem(text = { Text("Обновить") }, onClick = { menu = false; refresh(byUser = true) })
                            DropdownMenuItem(text = { Text("Выйти") }, onClick = { menu = false; onLogout() })
                        }
                    }
                },
            )
        },
        snackbarHost = { SnackbarHost(snackbar) },
        contentWindowInsets = contentInsets,
        containerColor = MaterialTheme.colorScheme.background,
    ) { padding ->
        PullToRefreshBox(
            isRefreshing = userRefresh,
            onRefresh = { refresh(byUser = true) },
            modifier = Modifier.fillMaxSize().padding(padding),
        ) {
            when {
                !loadedOnce && error == null -> Loading()
                !loadedOnce -> ErrorBox(error!!) { refresh(byUser = true) }
                else -> LazyColumn(
                    contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = 24.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    modifier = Modifier.fillMaxSize(),
                ) {
                    if (!canNotify) item(key = "b-notify") {
                        Banner("Уведомления выключены — о новых заказах телефон не сообщит.", "Включить") {
                            context.startActivity(
                                Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                                    .putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
                            )
                        }
                    }
                    if (canNotify && !batteryFree) item(key = "b-battery") {
                        Banner("Разрешите работу в фоне, чтобы уведомления приходили вовремя (особенно на Xiaomi, Huawei, Samsung).", "Разрешить") {
                            context.startActivity(
                                Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:${context.packageName}"))
                            )
                        }
                    }
                    item(key = "filters") {
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            val activeCount = orders.count { it.status in ACTIVE }
                            FilterChip(selected = onlyActive, onClick = { onlyActive = true }, label = { Text("Активные · $activeCount") })
                            FilterChip(selected = !onlyActive, onClick = { onlyActive = false }, label = { Text("Все") })
                        }
                    }
                    if (visible.isEmpty()) item(key = "empty") {
                        Text(
                            if (onlyActive) "Активных заказов нет 🎉" else "Заказов пока нет.",
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.fillMaxWidth().padding(top = 32.dp),
                        )
                    }
                    items(visible, key = { it.id }) { o -> OrderRow(o, Modifier.animateItem()) { onOpenOrder(o.id) } }
                    if (!onlyActive && hasMore && orders.isNotEmpty()) item(key = "more") {
                        OutlinedButton(onClick = { loadMore() }, enabled = !loadingMore, modifier = Modifier.fillMaxWidth()) {
                            Text(if (loadingMore) "Загружаю…" else "Показать ещё")
                        }
                    }
                    item(key = "end") { Spacer(Modifier.height(8.dp)) }
                }
            }
        }
    }
}

@Composable
private fun OrderRow(o: OrderListItem, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Card(
        onClick = onClick,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = modifier.fillMaxWidth(),
    ) {
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("#${o.shortId}", fontWeight = FontWeight.SemiBold)
                StatusChip(o.status, o.statusLabel)
                Spacer(Modifier.weight(1f))
                Text(rub(o.totalRub), fontWeight = FontWeight.SemiBold)
            }
            Text(o.customerName, style = MaterialTheme.typography.bodyLarge)
            Text(
                "${deliveryLabel(o.deliveryMethod)} · ${tomskTime(o.createdAt)}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
private fun Banner(text: String, action: String, onAction: () -> Unit) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
        modifier = Modifier.fillMaxWidth().clickable { onAction() },
    ) {
        Row(Modifier.padding(start = 14.dp, end = 4.dp, top = 6.dp, bottom = 6.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(text, Modifier.weight(1f), style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onPrimaryContainer)
            TextButton(onClick = onAction) {
                // Тёмный текст: золотой на светло-золотой плашке почти не читался.
                Text(action, color = MaterialTheme.colorScheme.onPrimaryContainer, fontWeight = FontWeight.Bold)
            }
        }
    }
}

private fun isIgnoringBatteryOptimizations(context: android.content.Context): Boolean =
    context.getSystemService(PowerManager::class.java)?.isIgnoringBatteryOptimizations(context.packageName) ?: true
