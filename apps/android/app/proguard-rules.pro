# Release build rules for the Gurukripa Ent Udyog app (R8 is enabled in app/build.gradle.kts).
# The app ships Room + Compose only, both of which generate code instead of using
# reflection, so no keep rules are needed for them. Rules are added here only when a
# reflection-based library (e.g. Gson) is actually wired into the app.

# Readable Play Store crash reports without full source mapping.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Retrofit/OkHttp optional platform providers (pulled in via the networking stack).
-dontwarn okhttp3.internal.platform.**
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**
