package ru.fourkings.admin.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import ru.fourkings.admin.BuildConfig
import java.io.IOException
import java.util.concurrent.TimeUnit

/** Ошибка обращения к сайту. code = HTTP-код (401 — ключ не действует), 0 — нет связи. */
class ApiException(val code: Int, override val message: String) : Exception(message)

/** Клиент API сайта (адреса /api/app/…). Все методы — suspend, сеть уходит в фоновый поток. */
object Api {
    val json = Json { ignoreUnknownKeys = true; explicitNulls = false }
    private val jsonType = "application/json; charset=utf-8".toMediaType()
    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .build()

    private suspend fun request(path: String, token: String?, postBody: String? = null): String =
        withContext(Dispatchers.IO) {
            val req = Request.Builder()
                .url("${BuildConfig.BASE_URL}/api/app$path")
                .apply {
                    if (token != null) header("Authorization", "Bearer $token")
                    if (postBody != null) post(postBody.toRequestBody(jsonType))
                }
                .build()
            try {
                client.newCall(req).execute().use { resp ->
                    val text = resp.body?.string().orEmpty()
                    if (!resp.isSuccessful) {
                        val msg = runCatching { json.decodeFromString<ApiErrorBody>(text).message }
                            .getOrNull()?.takeIf { it.isNotBlank() }
                            ?: "Ошибка сайта (${resp.code})"
                        throw ApiException(resp.code, msg)
                    }
                    text
                }
            } catch (e: IOException) {
                throw ApiException(0, "Нет связи с сайтом. Проверьте интернет.")
            }
        }

    suspend fun login(password: String, deviceName: String): LoginResponse =
        json.decodeFromString(request("/login", null, json.encodeToString(LoginRequest(password, deviceName))))

    suspend fun logout(token: String) {
        request("/logout", token, "{}")
    }

    suspend fun events(token: String, after: Int): EventsResponse =
        json.decodeFromString(request("/events?after=$after", token))

    suspend fun orders(token: String, before: String? = null, limit: Int = 30): OrdersResponse {
        val q = buildString {
            append("?limit=$limit")
            if (before != null) append("&before=").append(java.net.URLEncoder.encode(before, "UTF-8"))
        }
        return json.decodeFromString(request("/orders$q", token))
    }

    suspend fun order(token: String, id: String): OrderDetails =
        json.decodeFromString<OrderResponse>(request("/orders/$id", token)).order

    suspend fun setOrderStatus(token: String, id: String, status: String): OrderDetails =
        json.decodeFromString<OrderResponse>(
            request("/orders/$id/status", token, json.encodeToString(StatusRequest(status)))
        ).order

    suspend fun certificate(token: String, id: String): CertificateDetails =
        json.decodeFromString<CertificateResponse>(request("/certificates/$id", token)).certificate
}
