// Android-приложение админа сыроварни Four Kings.
// Сервер и API — в этом же репозитории (docs/app-api.md).
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "FourKingsAdmin"
include(":app")
