package ru.fourkings.admin.ui

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
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

private val light = lightColorScheme(
    primary = BrandGold,
    onPrimary = BrandCharcoal,
    primaryContainer = BrandGoldLight,
    onPrimaryContainer = BrandCharcoal,
    secondary = BrandGoldDeep,
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFF3E3C3),
    onSecondaryContainer = BrandCharcoal,
    background = BrandCream,
    onBackground = BrandCharcoal,
    surface = Color.White,
    onSurface = BrandCharcoal,
    surfaceVariant = Color(0xFFF3ECDF),
    onSurfaceVariant = BrandMute,
    surfaceContainer = Color.White,
    outline = Color(0xFFE4DACB),
    error = Color(0xFFC0392B),
)

// Тёмная тема — по настройке телефона (вечером не слепит). Тот же золотой акцент.
private val dark = darkColorScheme(
    primary = BrandGold,
    onPrimary = BrandCharcoal,
    primaryContainer = Color(0xFF4A3814),
    onPrimaryContainer = Color(0xFFF6DEAE),
    secondary = BrandGoldLight,
    onSecondary = BrandCharcoal,
    secondaryContainer = Color(0xFF3A2F1C),
    onSecondaryContainer = Color(0xFFF3E3C3),
    background = Color(0xFF14110E),
    onBackground = Color(0xFFF1EADF),
    surface = Color(0xFF1F1B17),
    onSurface = Color(0xFFF1EADF),
    surfaceVariant = Color(0xFF2B2520),
    onSurfaceVariant = Color(0xFFBDB2A4),
    surfaceContainer = Color(0xFF1F1B17),
    outline = Color(0xFF3B342D),
    error = Color(0xFFFF8A80),
)

@Composable
fun FourKingsTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = if (isSystemInDarkTheme()) dark else light, content = content)
}
