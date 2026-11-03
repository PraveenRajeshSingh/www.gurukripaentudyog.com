package com.gurukripa.entudyog.core.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val LightColorScheme = lightColorScheme(
    primary = BrandTerracotta,
    onPrimary = SurfaceCard,
    primaryContainer = SurfaceSubtle,
    onPrimaryContainer = BrandDark,
    secondary = BrandDark,
    onSecondary = SurfaceCard,
    tertiary = BrandAmber,
    background = CanvasBackground,
    onBackground = InkPrimary,
    surface = SurfaceCard,
    onSurface = InkPrimary,
    surfaceVariant = SurfaceSubtle,
    onSurfaceVariant = InkSecondary,
    outline = BorderMid
)

@Composable
fun GurukripaTheme(
    content: @Composable () -> Unit
) {
    val colorScheme = LightColorScheme
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = BrandDark.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = false
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}
