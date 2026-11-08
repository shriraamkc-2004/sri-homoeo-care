# =============================================================================
# Proguard / R8 Rules — Sri Homoeo Care Android Application
# =============================================================================

# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in getDefaultProguardFile("proguard-android-optimize.txt").

# Kotlin Coroutines
-keepclassmembers class kotlinx.coroutines.** {
    volatile <fields>;
}
-dontwarn kotlinx.coroutines.**

# Jetpack Compose & Compose Runtime
-keep class androidx.compose.runtime.** { *; }
-keep class androidx.compose.material3.** { *; }
-keepclassmembers class * {
    @androidx.compose.runtime.Composable *;
}
-dontwarn androidx.compose.**

# AndroidX Lifecycle & ViewModel
-keep class * extends androidx.lifecycle.ViewModel {
    <init>(...);
}
-keep class androidx.lifecycle.** { *; }
-dontwarn androidx.lifecycle.**

# Prevent obfuscation of app data models and UI state
-keep class com.example.srihomeoclinic.ui.** { *; }
-keep class com.srihomeoclinic.app.** { *; }

# Keep line numbers and source file names for production crash stack traces
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
