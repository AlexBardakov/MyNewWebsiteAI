package ru.fourkings.admin.ui

import java.text.NumberFormat
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

private val ru = Locale.forLanguageTag("ru-RU")
private val tomsk: ZoneId = ZoneId.of("Asia/Tomsk")
private val timeFmt = DateTimeFormatter.ofPattern("HH:mm", ru)
private val dateTimeFmt = DateTimeFormatter.ofPattern("d MMM, HH:mm", ru)

/** 1520 → «1 520 ₽» */
fun rub(n: Int): String = NumberFormat.getIntegerInstance(ru).format(n) + " ₽"

/** Количество позиции: для кг — из граммов («0,5 кг»), для штук — «2 шт». */
fun qty(unit: String, quantity: Int): String =
    if (unit == "kg") {
        val kg = quantity / 1000.0
        NumberFormat.getNumberInstance(ru).apply { maximumFractionDigits = 3 }.format(kg) + " кг"
    } else "$quantity шт"

/** Время по Томску: сегодня — «14:05», иначе — «3 дек., 14:05». */
fun tomskTime(iso: String): String = runCatching {
    val t = Instant.parse(iso).atZone(tomsk)
    if (t.toLocalDate() == LocalDate.now(tomsk)) "сегодня, " + t.format(timeFmt) else t.format(dateTimeFmt)
}.getOrDefault("")

fun deliveryLabel(method: String) = if (method == "delivery") "Доставка" else "Самовывоз"

/** Строка для tel: — только «+» и цифры. null, если на телефон не похоже (например, email). */
fun telUri(value: String): String? {
    val digits = value.filter { it.isDigit() }
    if (digits.length < 10 || digits.length > 15) return null
    val normalized = when {
        digits.length == 11 && (digits[0] == '8' || digits[0] == '7') -> "+7" + digits.drop(1)
        digits.length == 10 -> "+7$digits"
        else -> "+$digits"
    }
    return "tel:$normalized"
}
