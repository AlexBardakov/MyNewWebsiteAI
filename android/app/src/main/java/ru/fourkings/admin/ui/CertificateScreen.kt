package ru.fourkings.admin.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import ru.fourkings.admin.data.Api
import ru.fourkings.admin.data.ApiException
import ru.fourkings.admin.data.CertificateDetails

/** Подарочный сертификат: кто дарит, кому, контакты. Статусы меняются в веб-админке. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CertificateScreen(token: String, certificateId: String, onBack: () -> Unit, onUnauthorized: () -> Unit) {
    var cert by remember { mutableStateOf<CertificateDetails?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var reload by remember { mutableIntStateOf(0) }

    LaunchedEffect(certificateId, reload) {
        error = null
        try {
            cert = Api.certificate(token, certificateId)
        } catch (e: ApiException) {
            if (e.code == 401) onUnauthorized() else error = e.message
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(cert?.let { "Сертификат №${it.shortNumber}" } ?: "Сертификат") },
                navigationIcon = { BackButton(onBack) },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background),
            )
        },
        containerColor = MaterialTheme.colorScheme.background,
    ) { padding ->
        val c = cert
        when {
            c == null && error != null -> ErrorBox(error!!) { reload++ }
            c == null -> Loading()
            else -> Column(
                Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    StatusChip(c.status, c.statusLabel)
                    Text("${rub(c.amount)} · ${tomskTime(c.createdAt)}", color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                Section {
                    Text("От кого: ${c.senderName}", style = MaterialTheme.typography.titleMedium)
                    PhoneButton(c.senderContact)
                }
                Section {
                    Text("Кому: ${c.recipientName}", style = MaterialTheme.typography.titleMedium)
                    PhoneButton(c.recipientContact)
                    if (!c.message.isNullOrBlank()) {
                        Text("Пожелание: ${c.message}", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
                Text(
                    "Подтвердить оплату и погасить сертификат можно в веб-админке.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}
