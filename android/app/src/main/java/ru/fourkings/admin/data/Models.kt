package ru.fourkings.admin.data

import kotlinx.serialization.Serializable

// Форматы ответов сайта — см. docs/app-api.md в корне репозитория.

@Serializable
data class LoginRequest(val password: String, val deviceName: String)

@Serializable
data class LoginResponse(val token: String, val deviceId: String, val cursor: Int)

@Serializable
data class AppEvent(
    val id: Int,
    val type: String,          // "order.created" | "certificate.created"
    val entityId: String,
    val title: String,
    val body: String,
    val createdAt: String,
)

@Serializable
data class EventsResponse(val events: List<AppEvent>, val cursor: Int)

@Serializable
data class OrderListItem(
    val id: String,
    val shortId: String,
    val status: String,
    val statusLabel: String,
    val customerName: String,
    val deliveryMethod: String,
    val totalRub: Int,
    val itemsCount: Int? = null,
    val createdAt: String,
)

@Serializable
data class OrdersResponse(val orders: List<OrderListItem>)

@Serializable
data class OrderItem(
    val productName: String,
    val variant: String? = null,
    val unit: String,          // "kg" | "pcs"
    val quantity: Int,         // для kg — в граммах
    val priceRub: Int,
    val lineTotalRub: Int,
)

@Serializable
data class OrderDetails(
    val id: String,
    val shortId: String,
    val status: String,
    val statusLabel: String,
    val customerName: String,
    val deliveryMethod: String,
    val totalRub: Int,
    val itemsCount: Int? = null,
    val createdAt: String,
    val customerPhone: String,
    val customerAddress: String? = null,
    val customerComment: String? = null,
    val items: List<OrderItem>,
)

@Serializable
data class OrderResponse(val order: OrderDetails)

@Serializable
data class StatusRequest(val status: String)

@Serializable
data class CertificateDetails(
    val id: String,
    val shortNumber: String,
    val status: String,
    val statusLabel: String,
    val amount: Int,
    val senderName: String,
    val senderContact: String,
    val recipientName: String,
    val recipientContact: String,
    val message: String? = null,
    val createdAt: String,
)

@Serializable
data class CertificateResponse(val certificate: CertificateDetails)

@Serializable
data class ApiErrorBody(val error: String = "", val message: String = "")
