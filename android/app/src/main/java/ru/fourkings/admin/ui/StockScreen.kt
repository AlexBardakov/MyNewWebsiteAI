package ru.fourkings.admin.ui

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilledTonalIconButton
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.TextRange
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.LifecycleResumeEffect
import ru.fourkings.admin.data.ProductStock

private enum class StockFilter(val label: String) { All("Все"), In("В наличии"), Out("Нет") }

fun unitShort(unit: String) = if (unit == "kg") "кг" else "шт"

/**
 * Утреннее «что сегодня в наличии»: все товары по категориям, «−/+» и ввод числа.
 * Сохраняется само (через 0,7 с после последнего нажатия). 0 = «нет в наличии» на сайте.
 */
@OptIn(ExperimentalMaterial3Api::class, ExperimentalFoundationApi::class)
@Composable
fun StockScreen(
    state: StockState,
    snackbar: SnackbarHostState,
    contentInsets: WindowInsets,
    onLogout: () -> Unit,
) {
    val haptic = LocalHapticFeedback.current
    var query by rememberSaveable { mutableStateOf("") }
    var filter by rememberSaveable { mutableStateOf(StockFilter.All) }
    var menu by remember { mutableStateOf(false) }
    var editing by remember { mutableStateOf<ProductStock?>(null) }

    // Свежие данные при каждом возвращении на экран (без индикатора, если список уже есть).
    LifecycleResumeEffect(Unit) {
        state.load()
        onPauseOrDispose { }
    }

    val q = query.trim().lowercase()
    val all = state.products
    val inCount = all.count { state.valueOf(it) > 0 }
    val visible = all.filter { p ->
        (q.isEmpty() || p.name.lowercase().contains(q)) &&
            when (filter) {
                StockFilter.All -> true
                StockFilter.In -> state.valueOf(p) > 0
                StockFilter.Out -> state.valueOf(p) <= 0
            }
    }
    val groups = state.categories
        .map { c -> c to visible.filter { it.categoryId == c.id } }
        .filter { it.second.isNotEmpty() }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Остатки") },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background),
                actions = {
                    Box {
                        TextButton(onClick = { menu = true }) { Text("•••") }
                        DropdownMenu(expanded = menu, onDismissRequest = { menu = false }) {
                            DropdownMenuItem(text = { Text("Обновить") }, onClick = { menu = false; state.load() })
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
        Column(Modifier.fillMaxSize().padding(padding)) {
            // Поиск
            OutlinedTextField(
                value = query,
                onValueChange = { query = it },
                placeholder = { Text("Найти товар") },
                leadingIcon = { Icon(AppIcons.Search, contentDescription = null) },
                trailingIcon = {
                    if (query.isNotEmpty()) IconButton(onClick = { query = "" }) { Icon(AppIcons.Close, contentDescription = "Очистить") }
                },
                singleLine = true,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                shape = MaterialTheme.shapes.extraLarge,
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
            )
            // Фильтры со счётчиками
            Row(Modifier.padding(horizontal = 16.dp, vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                StockFilter.entries.forEach { f ->
                    val n = when (f) { StockFilter.All -> all.size; StockFilter.In -> inCount; StockFilter.Out -> all.size - inCount }
                    FilterChip(selected = filter == f, onClick = { filter = f }, label = { Text("${f.label} · $n") })
                }
            }

            PullToRefreshBox(
                isRefreshing = state.loading && state.loadedOnce,
                onRefresh = { state.load() },
                modifier = Modifier.fillMaxSize(),
            ) {
                when {
                    !state.loadedOnce && state.loadError == null -> Loading()
                    !state.loadedOnce -> ErrorBox(state.loadError!!) { state.load() }
                    groups.isEmpty() -> Text(
                        if (q.isNotEmpty()) "Ничего не найдено" else "Здесь пусто",
                        Modifier.fillMaxWidth().padding(32.dp),
                        textAlign = TextAlign.Center,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    else -> LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(bottom = 24.dp)) {
                        groups.forEach { (cat, items) ->
                            stickyHeader(key = "h-${cat.id}") {
                                Text(
                                    cat.name,
                                    style = MaterialTheme.typography.titleSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    modifier = Modifier.fillMaxWidth()
                                        .background(MaterialTheme.colorScheme.background)
                                        .padding(horizontal = 16.dp, vertical = 8.dp),
                                )
                            }
                            items(items, key = { it.id }) { p ->
                                StockRow(
                                    p = p,
                                    value = state.valueOf(p),
                                    saving = state.saving[p.id] == true || state.pending.containsKey(p.id),
                                    failed = state.failed[p.id] == true,
                                    onMinus = {
                                        haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                        state.change(p.id, state.valueOf(p) - 1)
                                    },
                                    onPlus = {
                                        haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                        state.change(p.id, state.valueOf(p) + 1)
                                    },
                                    onEdit = { editing = p },
                                    modifier = Modifier.animateItem(),
                                )
                                HorizontalDivider(Modifier.padding(start = 16.dp), color = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f))
                            }
                        }
                    }
                }
            }
        }
    }

    editing?.let { p ->
        RemainderDialog(
            product = p,
            current = state.valueOf(p),
            onDismiss = { editing = null },
            onSave = { v ->
                editing = null
                haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                state.change(p.id, v)
            },
        )
    }
}

@Composable
private fun StockRow(
    p: ProductStock,
    value: Int,
    saving: Boolean,
    failed: Boolean,
    onMinus: () -> Unit,
    onPlus: () -> Unit,
    onEdit: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val out = value <= 0
    Row(
        modifier.fillMaxWidth().background(MaterialTheme.colorScheme.surface).padding(start = 16.dp, end = 8.dp, top = 10.dp, bottom = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(Modifier.weight(1f).padding(end = 8.dp)) {
            Text(
                p.name,
                style = MaterialTheme.typography.bodyLarge,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                color = if (out) MaterialTheme.colorScheme.onSurfaceVariant else MaterialTheme.colorScheme.onSurface,
            )
            val sub = buildList {
                add("${rub(p.priceRub)}/${unitShort(p.unit)}")
                if (p.variants.isNotEmpty()) add(p.variants.joinToString(", "))
            }.joinToString(" · ")
            Text(sub, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
            when {
                failed -> Text("не сохранено — нажмите число", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.error)
                !p.isActive -> Text("скрыт с сайта", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.secondary)
                out -> Text("нет в наличии", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.error)
            }
        }
        FilledTonalIconButton(onClick = onMinus, enabled = value > 0) { Icon(AppIcons.Minus, contentDescription = "Меньше") }
        Box(
            Modifier.widthIn(min = 64.dp).height(48.dp).clickable(onClick = onEdit).padding(horizontal = 4.dp),
            contentAlignment = Alignment.Center,
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    if (out) "0" else value.toString(),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = if (out) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurface,
                )
                Text(" ${unitShort(p.unit)}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            if (saving) CircularProgressIndicator(Modifier.size(10.dp).align(Alignment.TopEnd), strokeWidth = 1.5.dp)
        }
        FilledTonalIconButton(onClick = onPlus) { Icon(AppIcons.Plus, contentDescription = "Больше") }
    }
}

/** Ввод точного числа с цифровой клавиатуры. */
@Composable
private fun RemainderDialog(product: ProductStock, current: Int, onDismiss: () -> Unit, onSave: (Int) -> Unit) {
    val start = current.toString()
    var field by remember { mutableStateOf(TextFieldValue(start, selection = TextRange(0, start.length))) }
    val focus = remember { FocusRequester() }
    val parsed = field.text.toIntOrNull()
    val valid = parsed != null && parsed in 0..100_000

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(product.name, maxLines = 2, overflow = TextOverflow.Ellipsis) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = field,
                    onValueChange = { v -> field = v.copy(text = v.text.filter { it.isDigit() }.take(6)) },
                    label = { Text("Остаток, ${unitShort(product.unit)}") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number, imeAction = ImeAction.Done),
                    keyboardActions = KeyboardActions(onDone = { if (valid) onSave(parsed!!) }),
                    modifier = Modifier.fillMaxWidth().focusRequester(focus),
                )
                TextButton(onClick = { onSave(0) }) { Text("Нет в наличии (0)", color = MaterialTheme.colorScheme.error) }
            }
        },
        confirmButton = { TextButton(onClick = { onSave(parsed!!) }, enabled = valid) { Text("Сохранить") } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Отмена") } },
    )
    LaunchedEffect(Unit) { focus.requestFocus() }
}

