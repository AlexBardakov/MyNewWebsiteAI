# Правила R8 для «Four Kings Админ».
# Библиотеки (OkHttp, kotlinx.serialization, WorkManager, Compose) приносят свои правила сами.

# kotlinx.serialization: сохраняем сгенерированные сериализаторы наших моделей.
-keepclassmembers class ru.fourkings.admin.data.** {
    *** Companion;
    kotlinx.serialization.KSerializer serializer(...);
}
-keep,includedescriptorclasses class ru.fourkings.admin.data.**$$serializer { *; }

# Понятные трассировки ошибок, если они когда-нибудь понадобятся.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# OkHttp на Android не использует эти платформенные классы.
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**
