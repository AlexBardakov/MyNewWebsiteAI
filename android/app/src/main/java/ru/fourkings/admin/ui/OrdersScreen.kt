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
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
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
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.LifecycleResumeEffect
import kotlinx.coroutines.launch
import ru.fourkings.admin.data.Api
import ru.fourkings.admin.data.ApiException
import ru.fourkings.admin.data.OrderListItem
import ru.fourkings.admin.notify.Notifier
import ru.fourkings.admin.work.Poller

private const val PAGE = 30

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrdersScreen(
    token: String,
    onOpenOrder: (String) -> Unit,
    onUnauthorized: () -> Unit,
    onLogout: () -> Unit,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val orders = remember { mutableStateListOf<OrderListItem>() }
    var refreshing by remember { mutableStateOf(false) }
    var loadingMore by remember { mutableStateOf(false) }
    var hasMore by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var firstLoad by remember { mutableStateOf(true) }
    var menu by remember { mutableStateOf(false) }
    var canNotify by remember { mutableStateOf(Notifier.canNotify(context)) }
    var batteryFree by remember { mutableStateOf(isIgnoringBatteryOptimizations(context)) }

    fun handle(e: ApiException) {
        if (e.code == 401) onUnauthorized() else error = e.message
    }

    fun refresh() {
        scope.launch {
            refreshing = true
            try {
                runCatching { Poller.poll(context) } // заодно уведомления о том, что пришло, пока приложение было закрыто
                val page = Api.orders(token, limit = PAGE).orders
                orders.clear(); orders.addAll(page)
                hasMore = page.size == PAGE
                error = null
            } catch (e: ApiException) {
                handle(e)
            } finally {
                refreshing = false; firstLoad = false
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

    // При каждом возвращении в приложение — свежий список и проверка разрешений.
    LifecycleResumeEffect(Unit) {
        canNotify = Notifier.canNotify(context)
        batteryFree = isIgnoringBatteryOptimizations(context)
        refresh()
        onPauseOrDispose { }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Заказы") },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background),
                actions = {
                    Box {
                        TextButton(onClick = { menu = true }) { Text("•••") }
                        DropdownMenu(expanded = menu, onDismissRequest = { menu = false }) {
                            DropdownMenuItem(text = { Text("Обновить") }, onClick = { menu = false; refresh() })
                            DropdownMenuItem(text = { Text("Выйти") }, onClick = { menu = false; onLogout() })
                        }
                    }
                },
            )
        },
        containerColor = MaterialTheme.colorScheme.background,
    ) { padding ->
        PullToRefreshBox(
            isRefreshing = refreshing && !firstLoad,
            onRefresh = { refresh() },
            modifier = Modifier.fillMaxSize().padding(padding),
        ) {
            when {
                firstLoad && orders.isEmpty() && error == null -> Loading()
                orders.isEmpty() && error != null -> ErrorBox(error!!) { refresh() }
                else -> LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    modifier = Modifier.fillMaxSize(),
                ) {
                    if (!canNotify) item {
                        Banner(
                            "Уведомления выключены — о новых заказах телефон не сообщит.",
                            "Включить",
                        ) {
                            context.startActivity(
                                Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                                    .putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
                            )
                        }
                    }
                    if (canNotify && !batteryFree) item {
                        Banner(
                            "Разрешите работу в фоне, чтобы уведомления приходили вовремя (особенно на Xiaomi, Huawei, Samsung).",
                            "Разрешить",
                        ) {
                            context.startActivity(
                                Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:${context.packageName}"))
                            )
                        }
                    }
                    if (error != null) item { Text(error!!, color = MaterialTheme.colorScheme.error) }
                    if (orders.isEmpty()) item {
                        Text("Заказов пока нет.", color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(top = 24.dp))
                    }
                    items(orders, key = { it.id }) { o -> OrderRow(o) { onOpenOrder(o.id) } }
                    if (hasMore && orders.isNotEmpty()) item {
                        OutlinedButton(onClick = { loadMore() }, enabled = !loadingMore, modifier = Modifier.fillMaxWidth()) {
                            Text(if (loadingMore) "Загружаю…" else "Показать ещё")
                        }
                    }
                    item { Spacer(Modifier.height(24.dp)) }
                }
            }
        }
    }
}

@Composable
private fun OrderRow(o: OrderListItem, onClick: () -> Unit) {
    Card(
        onClick = onClick,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = Modifier.fillMaxWidth(),
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
            Text(text, Modifier.weight(1f), style = MaterialTheme.typography.bodyMedium)
            TextButton(onClick = onAction) {
                // Тёмный текст: золотой на светло-золотой плашке почти не читался.
                Text(action, color = MaterialTheme.colorScheme.onPrimaryContainer, fontWeight = FontWeight.Bold)
            }
        }
    }
}

private fun isIgnoringBatteryOptimizations(context: android.content.Context): Boolean =
    context.getSystemService(PowerManager::class.java)?.isIgnoringBatteryOptimizations(context.packageName) ?: true
