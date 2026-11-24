package ru.fourkings.admin.ui

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.PathBuilder
import androidx.compose.ui.graphics.vector.path
import androidx.compose.ui.unit.dp

/**
 * Несколько контурных иконок в стиле Material (линия 2dp, скруглённые концы).
 * Рисуем сами: библиотека иконок прибавила бы к приложению лишний вес.
 * Цвет задаёт Icon(tint = …) — здесь чёрный только как заготовка.
 */
private fun outline(name: String, block: PathBuilder.() -> Unit): ImageVector =
    ImageVector.Builder(name, 24.dp, 24.dp, 24f, 24f).path(
        stroke = SolidColor(Color.Black), strokeLineWidth = 2f,
        strokeLineCap = StrokeCap.Round, strokeLineJoin = StrokeJoin.Round,
        pathBuilder = block,
    ).build()

object AppIcons {
    /** Заказы — чек со строками. */
    val Orders by lazy {
        outline("orders") {
            moveTo(6f, 3f); lineTo(18f, 3f); lineTo(18f, 21f); lineTo(15f, 19f); lineTo(12f, 21f)
            lineTo(9f, 19f); lineTo(6f, 21f); close()
            moveTo(9f, 8f); lineTo(15f, 8f)
            moveTo(9f, 12f); lineTo(15f, 12f)
        }
    }

    /** Остатки — коробка. */
    val Stock by lazy {
        outline("stock") {
            moveTo(3f, 7.5f); lineTo(12f, 3f); lineTo(21f, 7.5f); lineTo(21f, 16.5f)
            lineTo(12f, 21f); lineTo(3f, 16.5f); close()
            moveTo(3f, 7.5f); lineTo(12f, 12f); lineTo(21f, 7.5f)
            moveTo(12f, 12f); lineTo(12f, 21f)
        }
    }

    val Plus by lazy { outline("plus") { moveTo(12f, 5f); lineTo(12f, 19f); moveTo(5f, 12f); lineTo(19f, 12f) } }
    val Minus by lazy { outline("minus") { moveTo(5f, 12f); lineTo(19f, 12f) } }

    val Search by lazy {
        outline("search") {
            moveTo(17f, 10.5f)
            arcTo(6.5f, 6.5f, 0f, isMoreThanHalf = true, isPositiveArc = true, x1 = 4f, y1 = 10.5f)
            arcTo(6.5f, 6.5f, 0f, isMoreThanHalf = true, isPositiveArc = true, x1 = 17f, y1 = 10.5f)
            moveTo(15.5f, 15.5f); lineTo(20f, 20f)
        }
    }

    val Close by lazy { outline("close") { moveTo(6f, 6f); lineTo(18f, 18f); moveTo(18f, 6f); lineTo(6f, 18f) } }

    val Back by lazy {
        outline("back") { moveTo(19f, 12f); lineTo(5f, 12f); moveTo(12f, 19f); lineTo(5f, 12f); lineTo(12f, 5f) }
    }
}
