package ru.fourkings.admin.ui

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// Цвета сайта (app/globals.css: --brand-*), переведённые из OKLCH в sRGB.
val BrandCream = Color(0xFFFAF6EE)
val BrandGold = Color(0xFFD79D34)
val BrandGoldLight = Color(0xFFEBBE6F)
val BrandGoldDeep = Color(0xFFB67700)
val BrandCharcoal = Color(0xFF171310)
val BrandMute = Color(0xFF6F665C)

private val colors = lightColorScheme(
    primary = BrandGold,
    onPrimary = BrandCharcoal,
    primaryContainer = BrandGoldLight,
    onPrimaryContainer = BrandCharcoal,
    secondary = BrandGoldDeep,
    onSecondary = Color.White,
    background = BrandCream,
    onBackground = BrandCharcoal,
    surface = Color.White,
    onSurface = BrandCharcoal,
    surfaceVariant = Color(0xFFF3ECDF),
    onSurfaceVariant = BrandMute,
    outline = Color(0xFFE4DACB),
    error = Color(0xFFC0392B),
)

@Composable
fun FourKingsTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = colors, content = content)
}
