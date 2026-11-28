# Flutter / Dart
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }

# Keep annotations
-keepattributes *Annotation*

# Bluetooth thermal printing
-keep class com.print_bluetooth_thermal.** { *; }

# Google ML Kit
-keep class com.google.mlkit.** { *; }
-dontwarn com.google.mlkit.**

# Flutter deferred components / Play Core
-dontwarn com.google.android.play.core.**

# General
-dontwarn javax.**
-dontwarn sun.misc.**
