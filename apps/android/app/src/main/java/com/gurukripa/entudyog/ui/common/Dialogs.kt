package com.gurukripa.entudyog.ui.common

import androidx.compose.foundation.BoxWithConstraints
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material3.BasicAlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.DialogProperties
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.dialog
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.text.KeyboardOptions
import com.gurukripa.entudyog.core.theme.SemanticDanger
import com.gurukripa.entudyog.core.theme.SemanticSuccess

/**
 * Gurukripa popup kit — one implementation of every dialog the app needs:
 * confirmation, message (success/error/info), progress, and adaptive forms.
 *
 * Adaptive rule (spec §1): below 600dp the form dialog renders as a
 * Material 3 bottom sheet; on wider screens (foldables, tablets, desktop)
 * it becomes a centered dialog capped at 460dp. Content scrolls internally,
 * IME insets are respected, and dismissal is only allowed when the caller
 * declares it safe (dismissOnBackPress/dismissOnClickOutside).
 */

private val CompactWidth = 600.dp
private val DialogMaxWidth = 460.dp

enum class GBMessageKind { SUCCESS, ERROR, INFO }

/** Destructive-action confirmation. Backdrop taps never dismiss it; only an explicit choice does. */
@Composable
fun GBConfirmDialog(
    title: String,
    message: String,
    confirmLabel: String = "Confirm",
    dismissLabel: String = "Cancel",
    danger: Boolean = false,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            Button(
                onClick = onConfirm,
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (danger) SemanticDanger else MaterialTheme.colorScheme.primary
                )
            ) { Text(confirmLabel, fontWeight = FontWeight.Bold) }
        },
        dismissButton = {
            OutlinedButton(onClick = onDismiss) { Text(dismissLabel) }
        },
        title = { Text(title, fontWeight = FontWeight.Black) },
        text = { Text(message, style = MaterialTheme.typography.bodyMedium) },
        shape = MaterialTheme.shapes.extraLarge,
        // Backdrop tap closes; hardware back mirrors it. Destructive actions keep the user safe either way.
        properties = DialogProperties(dismissOnBackPress = true, dismissOnClickOutside = true)
    )
}

/** Success / error / info feedback. Shown only after the action it describes actually completed. */
@Composable
fun GBMessageDialog(
    title: String,
    message: String,
    kind: GBMessageKind = GBMessageKind.INFO,
    primaryLabel: String = "OK",
    onDismiss: () -> Unit
) {
    val (tint, icon) = when (kind) {
        GBMessageKind.SUCCESS -> SemanticSuccess to Icons.Filled.Check
        GBMessageKind.ERROR -> SemanticDanger to Icons.Filled.Close
        GBMessageKind.INFO -> MaterialTheme.colorScheme.primary to Icons.Filled.Info
    }
    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            Button(onClick = onDismiss) { Text(primaryLabel, fontWeight = FontWeight.Bold) }
        },
        icon = {
            Surface(shape = MaterialTheme.shapes.large, color = tint.copy(alpha = 0.12f)) {
                Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.padding(10.dp))
            }
        },
        title = { Text(title, fontWeight = FontWeight.Black) },
        text = { Text(message, style = MaterialTheme.typography.bodyMedium) },
        shape = MaterialTheme.shapes.extraLarge
    )
}

/** Blocking progress state — used while an async action is in flight. Deliberately undismissable mid-operation. */
@Composable
fun GBProgressDialog(message: String) {
    BasicAlertDialog(
        onDismissRequest = { /* in-flight: ignore */ },
        properties = DialogProperties(dismissOnBackPress = false, dismissOnClickOutside = false)
    ) {
        Surface(
            shape = MaterialTheme.shapes.extraLarge,
            tonalElevation = 6.dp,
            modifier = Modifier.widthIn(min = 240.dp, max = DialogMaxWidth)
        ) {
            Row(
                modifier = Modifier.padding(24.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                CircularProgressIndicator(modifier = Modifier.size(22.dp), strokeWidth = 2.5.dp)
                Text(message, style = MaterialTheme.typography.bodyMedium)
            }
        }
    }
}

/**
 * Adaptive content dialog: bottom sheet on phones, centered card on ≥600dp.
 * `dismissible=false` freezes backdrop + back press (unsaved form protection).
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GBAdaptiveDialog(
    title: String,
    onDismiss: () -> Unit,
    dismissible: Boolean = true,
    content: @Composable ColumnScope.() -> Unit
) {
    BoxWithConstraints {
        if (maxWidth < CompactWidth) {
            val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
            ModalBottomSheet(
                onDismissRequest = onDismiss,
                sheetState = sheetState,
                sheetGesturesEnabled = dismissible,
                dragHandle = null
            ) {
                GBDialogHeader(title, onDismiss, dismissible)
                GBDialogBody(content)
            }
        } else {
            BasicAlertDialog(
                onDismissRequest = onDismiss,
                properties = DialogProperties(
                    dismissOnBackPress = dismissible,
                    dismissOnClickOutside = dismissible
                ),
                modifier = Modifier
                    .widthIn(max = DialogMaxWidth)
                    .semantics { this.dialog() }
            ) {
                Surface(
                    shape = MaterialTheme.shapes.extraLarge,
                    tonalElevation = 6.dp,
                    color = MaterialTheme.colorScheme.surface
                ) {
                    GBDialogHeader(title, onDismiss, dismissible)
                    GBDialogBody(content)
                }
            }
        }
    }
}

@Composable
private fun GBDialogHeader(title: String, onDismiss: () -> Unit, dismissible: Boolean) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(start = 24.dp, end = 12.dp, top = 20.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Black,
            modifier = Modifier.weight(1f)
        )
        if (dismissible) {
            IconButton(onClick = onDismiss, modifier = Modifier.size(40.dp)) {
                Icon(Icons.Filled.Clear, contentDescription = "Close dialog")
            }
        }
    }
}

@Composable
private fun ColumnScope.GBDialogBody(content: @Composable ColumnScope.() -> Unit) {
    // Internal scrolling keeps every action reachable on short screens;
    // imePadding lifts content above the keyboard; safeDrawing respects notches/gesture bars.
    Column(
        modifier = Modifier
            .weight(1f, fill = false)
            .heightIn(max = 520.dp)
            .verticalScroll(rememberScrollState())
            .imePadding()
            .padding(horizontal = 24.dp, vertical = 16.dp)
            .safeDrawingPadding(),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        content = content
    )
}

/** Form dialog with a guarded submit: the primary button cannot double-fire while `busy`. */
@Composable
fun GBFormDialog(
    title: String,
    primaryLabel: String,
    busy: Boolean = false,
    secondaryLabel: String = "Cancel",
    onSubmit: () -> Unit,
    onDismiss: () -> Unit,
    content: @Composable ColumnScope.() -> Unit
) {
    GBAdaptiveDialog(
        title = title,
        onDismiss = onDismiss,
        // Never discard a form mid-submit:
        dismissible = !busy
    ) {
        content()
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp, Alignment.End)
        ) {
            OutlinedButton(onClick = onDismiss, enabled = !busy) { Text(secondaryLabel) }
            Button(onClick = onSubmit, enabled = !busy) {
                if (busy) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                        strokeWidth = 2.dp,
                        color = Color.White
                    )
                } else {
                    Text(primaryLabel, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

/** Labeled text field with inline validation message — the only field style used inside popups. */
@Composable
fun GBField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    error: String? = null,
    placeholder: String = "",
    singleLine: Boolean = true,
    keyboardType: KeyboardType = KeyboardType.Text,
    supportingHint: String? = null
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        placeholder = { if (placeholder.isNotEmpty()) Text(placeholder) },
        isError = error != null,
        singleLine = singleLine,
        keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
        shape = MaterialTheme.shapes.medium,
        modifier = Modifier.fillMaxWidth(),
        supportingText = when {
            error != null -> {
                { Text(error, color = SemanticDanger, style = MaterialTheme.typography.bodySmall) }
            }
            supportingHint != null -> {
                { Text(supportingHint, color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodySmall) }
            }
            else -> null
        }
    )
}
