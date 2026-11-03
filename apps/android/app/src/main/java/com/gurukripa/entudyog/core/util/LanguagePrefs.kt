package com.gurukripa.entudyog.core.util

import android.content.Context
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf

/**
 * App-wide language preference for the pure-Compose client.
 *
 * The app is a [androidx.activity.ComponentActivity] (no AppCompat), so instead of
 * `AppCompatDelegate.setApplicationLocales` we keep the chosen tag in a Compose
 * [MutableState] and drive resource lookup through a localized `Resources` object
 * (see `ui.common.LocalizedApp`). The tag is persisted so the choice survives
 * restarts; English is the default for first-time visitors.
 */
object LanguagePrefs {

    private const val PREFS = "gk_language"
    private const val KEY = "lang"

    const val EN = "en"
    const val HI = "hi"

    /** Observed by [com.gurukripa.entudyog.ui.common.LocalizedApp]; changing it recomposes the UI. */
    val language: MutableState<String> = mutableStateOf(EN)

    fun init(context: Context) {
        val tag = context.applicationContext
            .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString(KEY, EN)
        language.value = if (tag == HI) HI else EN
    }

    fun set(context: Context, tag: String) {
        val value = if (tag == HI) HI else EN
        language.value = value
        context.applicationContext
            .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY, value)
            .apply()
    }

    fun isHindi(): Boolean = language.value == HI
}
