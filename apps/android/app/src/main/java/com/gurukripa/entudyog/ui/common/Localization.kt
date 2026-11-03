package com.gurukripa.entudyog.ui.common

import androidx.annotation.StringRes
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.LocalResources
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.gurukripa.entudyog.R
import com.gurukripa.entudyog.core.util.LanguagePrefs
import android.content.res.Configuration
import android.content.res.Resources
import java.util.Locale

/**
 * Provides the active language's [Resources] to the whole Compose tree.
 *
 * `LocalizedApp` rebuilds a localized context whenever [LanguagePrefs.language]
 * changes, so calling [str]/[strFmt] recomposes with the new language instantly —
 * without an Activity restart, which keeps the current screen and any in-progress
 * form state intact.
 */
val LocalizedResources = compositionLocalOf<Resources> {
    error("LocalizedResources not provided — wrap content in LocalizedApp {}")
}

@Composable
fun LocalizedApp(content: @Composable () -> Unit) {
    val base = LocalContext.current
    val tag = LanguagePrefs.language.value

    val localized = remember(base, tag) {
        val config = Configuration(base.resources.configuration)
        config.setLocale(Locale(if (tag == LanguagePrefs.HI) "hi" else "en"))
        base.createConfigurationContext(config)
    }

    // Provide both our own LocalizedResources (used by str/strFmt) and Compose's
    // built-in LocalResources (used by stringResource/Material), so every lookup
    // path resolves in the selected language.
    CompositionLocalProvider(
        LocalizedResources provides localized.resources,
        LocalResources provides localized.resources
    ) {
        content()
    }
}

/** Resolve a string resource in the active language. */
@Composable
fun str(@StringRes id: Int): String = LocalizedResources.current.getString(id)

/** Resolve a formatted string resource in the active language. */
@Composable
fun strFmt(@StringRes id: Int, vararg args: Any): String =
    LocalizedResources.current.getString(id, *args)

/**
 * English | हिंदी segmented switcher. Keyboard/talkback reachable (each choice is a
 * focusable button carrying its own language label).
 */
@Composable
fun LanguageSwitcher(modifier: Modifier = Modifier) {
    val context = LocalContext.current
    val current = LanguagePrefs.language.value
    val groupDesc = stringResource(R.string.lang_switch_desc)

    Row(
        modifier = modifier
            .semantics { contentDescription = groupDesc }
            .clip(RoundedCornerShape(999.dp))
            .background(MaterialTheme.colorScheme.surfaceVariant),
        horizontalArrangement = Arrangement.spacedBy(2.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        LanguageChip(
            label = stringResource(R.string.lang_english),
            selected = current == LanguagePrefs.EN,
            onClick = { LanguagePrefs.set(context, LanguagePrefs.EN) }
        )
        LanguageChip(
            label = stringResource(R.string.lang_hindi),
            selected = current == LanguagePrefs.HI,
            onClick = { LanguagePrefs.set(context, LanguagePrefs.HI) }
        )
    }
}

@Composable
private fun LanguageChip(label: String, selected: Boolean, onClick: () -> Unit) {
    val shape = RoundedCornerShape(999.dp)
    Text(
        text = label,
        style = MaterialTheme.typography.labelLarge,
        color = if (selected) MaterialTheme.colorScheme.onPrimary
        else MaterialTheme.colorScheme.onSurfaceVariant,
        modifier = Modifier
            .clip(shape)
            .background(if (selected) MaterialTheme.colorScheme.primary else androidx.compose.ui.graphics.Color.Transparent)
            .clickable(onClick = onClick)
            .semantics { contentDescription = label }
            .padding(horizontal = 12.dp, vertical = 6.dp)
    )
}
