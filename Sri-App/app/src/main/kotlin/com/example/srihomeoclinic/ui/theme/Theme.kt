package com.example.srihomeoclinic.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext

/**
 * Premium dark-first Material 3 scheme for Sri Homoeo Clinic.
 * Mirrors the web glassmorphism / navy-teal-gold system.
 */
private val DarkColorScheme = darkColorScheme(
    primary = primaryDark,
    onPrimary = Color(0xFF0B132B),
    primaryContainer = primaryContainerDark,
    onPrimaryContainer = TealGlow,
    secondary = secondaryDark,
    onSecondary = Color(0xFF1A1400),
    secondaryContainer = Color(0xFF3D3420),
    onSecondaryContainer = GoldLight,
    tertiary = tertiaryDark,
    onTertiary = Color(0xFF1A1400),
    background = BgDark,
    onBackground = TextPrimaryDark,
    surface = SurfaceDark,
    onSurface = TextPrimaryDark,
    surfaceVariant = SurfaceVariantDark,
    onSurfaceVariant = TextSecondaryDark,
    outline = GlassBorder,
    outlineVariant = Color(0x3348CAE4),
    error = ErrorRose,
    onError = Color(0xFF1A0505),
)

private val LightColorScheme = lightColorScheme(
    primary = primaryLight,
    onPrimary = Color(0xFF0B132B),
    primaryContainer = primaryContainerLight,
    onPrimaryContainer = EmeraldDark,
    secondary = secondaryLight,
    onSecondary = Color(0xFF1A1400),
    tertiary = tertiaryLight,
    background = BgDark,
    onBackground = TextPrimaryDark,
    surface = SurfaceDark,
    onSurface = TextPrimaryDark,
)

@Composable
fun SriHomeoClinicTheme(
    darkTheme: Boolean = true, // Clinic product is dark-first
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
