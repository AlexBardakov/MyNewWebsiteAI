package ru.fourkings.admin.ui

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import ru.fourkings.admin.data.Api
import ru.fourkings.admin.data.ApiException
import ru.fourkings.admin.data.OrderDetails

/** Карточка заказа: контакты, состав, смена статуса (как кнопки в веб-админке). */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrderScreen(token: String, orderId: String, onBack: () -> Unit, onUnauthorized: () -> Unit) {
    val scope = rememberCoroutineScope()
    var order by remember { mutableStateOf<OrderDetails?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var busy by remember { mutableStateOf(false) }
    var reload by remember { mutableIntStateOf(0) }
    var confirmCancel by remember { mutableStateOf(false) }
    val snackbar = remember { SnackbarHostState() }
    val haptic = LocalHapticFeedback.current

    LaunchedEffect(orderId, reload) {
        error = null
        try {
            order = Api.order(token, orderId)
        } catch (e: ApiException) {
            if (e.code == 401) onUnauthorized() else error = e.message
        }
    }

    fun setStatus(status: String) {
        scope.launch {
            busy = true
            try {
                val updated = Api.setOrderStatus(token, orderId, status)
                order = updated
                haptic.performHapticFeedback(HapticFeedbackType.Confirm)
                launch { snackbar.showSnackbar("Статус: ${updated.statusLabel}") }
            } catch (e: ApiException) {
                if (e.code == 401) onUnauthorized() else launch { snackbar.showSnackbar(e.message) }
            } finally {
                busy = false
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(order?.let { "Заказ #${it.shortId}" } ?: "Заказ") },
                navigationIcon = { BackButton(onBack) },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background),
            )
        },
        snackbarHost = { SnackbarHost(snackbar) },
        containerColor = MaterialTheme.colorScheme.background,
    ) { padding ->
        val o = order
        when {
            o == null && error != null -> ErrorBox(error!!) { reload++ }
            o == null -> Loading()
            else -> Column(
                Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    StatusChip(o.status, o.statusLabel)
                    Text(tomskTime(o.createdAt), color = MaterialTheme.colorScheme.onSurfaceVariant)
                }

                Section {
                    Text(o.customerName, style = MaterialTheme.typography.titleLarge)
                    PhoneButton(o.customerPhone)
                    Text(deliveryLabel(o.deliveryMethod), fontWeight = FontWeight.SemiBold)
                    if (o.deliveryMethod == "delivery" && !o.customerAddress.isNullOrBlank()) Text(o.customerAddress)
                    if (!o.customerComment.isNullOrBlank()) {
                        Text("Комментарий: ${o.customerComment}", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }

                Section {
                    Text("Состав", style = MaterialTheme.typography.titleMedium)
                    o.items.forEachIndexed { i, it ->
                        if (i > 0) HorizontalDivider(color = MaterialTheme.colorScheme.outline)
                        Row(Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                            Column(Modifier.weight(1f)) {
                                Text(it.productName)
                                if (!it.variant.isNullOrBlank()) {
                                    Text(it.variant, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                                Text(
                                    "${qty(it.unit, it.quantity)} × ${rub(it.priceRub)}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                            Text(rub(it.lineTotalRub), fontWeight = FontWeight.SemiBold)
                        }
                    }
                    HorizontalDivider(color = MaterialTheme.colorScheme.outline)
                    Row(Modifier.fillMaxWidth()) {
                        Text("Итого", Modifier.weight(1f), style = MaterialTheme.typography.titleMedium)
                        Text(rub(o.totalRub), style = MaterialTheme.typography.titleMedium)
                    }
                }

                Text("Статус", style = MaterialTheme.typography.titleMedium)
                Button(onClick = { setStatus("picking") }, enabled = !busy && o.status != "picking", modifier = Modifier.fillMaxWidth()) {
                    Text("В сборку")
                }
                Button(
                    onClick = { setStatus("completed") },
                    enabled = !busy && o.status != "completed",
                    colors = ButtonDefaults.buttonColors(containerColor = androidx.compose.ui.graphics.Color(0xFF2E7D32), contentColor = androidx.compose.ui.graphics.Color.White),
                    modifier = Modifier.fillMaxWidth(),
                ) { Text("Выполнен") }
                OutlinedButton(onClick = { confirmCancel = true }, enabled = !busy && o.status != "cancelled", modifier = Modifier.fillMaxWidth()) {
                    Text("Отменить заказ", color = MaterialTheme.colorScheme.error)
                }
                Spacer(Modifier.height(24.dp))
            }
        }
    }

    if (confirmCancel) {
        AlertDialog(
            onDismissRequest = { confirmCancel = false },
            title = { Text("Отменить заказ?") },
            text = { Text("Статус заказа станет «Отменён». Его можно будет вернуть кнопкой «В сборку».") },
            confirmButton = { TextButton(onClick = { confirmCancel = false; setStatus("cancelled") }) { Text("Отменить заказ") } },
            dismissButton = { TextButton(onClick = { confirmCancel = false }) { Text("Нет") } },
        )
    }
}

@Composable
fun Section(content: @Composable () -> Unit) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) { content() }
    }
}

/** Кнопка «позвонить» (открывает набор номера), если строка похожа на телефон; иначе — просто текст. */
@Composable
fun PhoneButton(value: String) {
    val context = LocalContext.current
    val tel = telUri(value)
    if (tel != null) {
        Button(onClick = { context.startActivity(Intent(Intent.ACTION_DIAL, Uri.parse(tel))) }, modifier = Modifier.fillMaxWidth()) {
            Text("Позвонить: $value")
        }
    } else {
        Text(value)
    }
}
