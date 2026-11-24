package ru.fourkings.admin.ui

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp

@Composable
fun BackButton(onBack: () -> Unit) {
    IconButton(onClick = onBack) { Icon(AppIcons.Back, contentDescription = "Назад") }
}

@Composable
fun Loading() {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
}

@Composable
fun ErrorBox(message: String, onRetry: () -> Unit) {
    Column(
        Modifier.fillMaxSize().padding(32.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp, Alignment.CenterVertically),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(message, textAlign = TextAlign.Center, style = MaterialTheme.typography.bodyLarge)
        Button(onClick = onRetry) { Text("Повторить") }
    }
}

/** Плашка статуса. */
@Composable
fun StatusChip(status: String, label: String) {
    val (lbg, lfg) = when (status) {
        "new", "PENDING" -> Color(0xFFDCEBFF) to Color(0xFF1D4E89)
        "picking" -> Color(0xFFFFF1C2) to Color(0xFF7A5A00)
        "awaiting_payment" -> Color(0xFFFFE3C7) to Color(0xFF8A4B00)
        "paid", "PAID", "SENT" -> Color(0xFFDDF3E4) to Color(0xFF1E6B3A)
        "completed", "USED" -> Color(0xFFE9E6E1) to Color(0xFF5C554D)
        "cancelled" -> Color(0xFFFBDADA) to Color(0xFF8E1F1F)
        else -> Color(0xFFE9E6E1) to Color(0xFF5C554D)
    }
    // В тёмной теме — та же гамма, но приглушённый фон и светлый текст.
    val (bg, fg) = if (isSystemInDarkTheme()) lfg.copy(alpha = 0.35f) to lbg else lbg to lfg
    Surface(color = bg, contentColor = fg, shape = MaterialTheme.shapes.small) {
        Text(label, Modifier.padding(horizontal = 8.dp, vertical = 3.dp), style = MaterialTheme.typography.labelMedium)
    }
}
