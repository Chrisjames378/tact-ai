package com.tactai.guardian

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.platform.LocalContext

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { TactGuardianApp() }
    }
}

private val Midnight = Color(0xFF101322)
private val Violet = Color(0xFF7657E8)
private val Mint = Color(0xFF65D6B0)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TactGuardianApp() {
    var selected by remember { mutableIntStateOf(0) }
    var assistantInput by remember { mutableStateOf("") }
    val tabs = listOf("Home", "Assistant", "Guardian", "Builder", "Settings")

    MaterialTheme {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = {
                        Column {
                            Text("TACT AI GUARDIAN")
                            Text("Your personal AI command centre", style = MaterialTheme.typography.labelSmall,
                                color = Color.Gray)
                        }
                    }
                )
            },
            bottomBar = {
                NavigationBar {
                    val icons = listOf(Icons.Default.Security, Icons.Default.Chat, Icons.Default.Security,
                        Icons.Default.Build, Icons.Default.Settings)
                    tabs.forEachIndexed { index, title ->
                        NavigationBarItem(
                            selected = selected == index,
                            onClick = { selected = index },
                            icon = { androidx.compose.material3.Icon(icons[index], contentDescription = title) },
                            label = { Text(title) }
                        )
                    }
                }
            }
        ) { padding ->
            Surface(
                modifier = Modifier.fillMaxSize().padding(padding),
                color = Midnight
            ) {
                when (selected) {
                    0 -> HomeScreen(onOpen = { selected = it })
                    1 -> AssistantScreen(value = assistantInput, onValueChange = { assistantInput = it })
                    2 -> GuardianScreen()
                    3 -> BuilderScreen()
                    else -> SettingsScreen()
                }
            }
        }
    }
}

@Composable
private fun HomeScreen(onOpen: (Int) -> Unit) {
    Column(
        modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState())
            .padding(18.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF24213B))) {
            Column(Modifier.fillMaxWidth().padding(20.dp)) {
                Text("Good evening", color = Color.White, style = MaterialTheme.typography.headlineMedium)
                Text("Your Guardian foundation is ready.", color = Color.LightGray)
                Spacer(Modifier.height(18.dp))
                Text("TACT STATUS  •  LOCAL SHELL ONLINE", color = Mint, style = MaterialTheme.typography.labelMedium)
                Text("AI connection not configured", color = Color.White)
            }
        }
        Text("YOUR COMMAND CENTRE", color = Color.White, style = MaterialTheme.typography.titleMedium)
        FeatureCard("AI Assistant", "Ask questions, plan tasks and prepare replies.", "Open assistant") { onOpen(1) }
        FeatureCard("Phone Guardian", "Review supported device health information.", "Open guardian") { onOpen(2) }
        FeatureCard("App Builder", "Connect projects, inspect code and deployment status.", "Open builder") { onOpen(3) }
        Text("Safety first: external actions require your approval.", color = Color.LightGray,
            style = MaterialTheme.typography.bodySmall)
    }
}

@Composable
private fun FeatureCard(title: String, description: String, action: String, onClick: () -> Unit) {
    Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF1B2033))) {
        Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(title, color = Color.White, style = MaterialTheme.typography.titleLarge)
            Text(description, color = Color.LightGray)
            Button(onClick = onClick) { Text(action) }
        }
    }
}

@Composable
private fun AssistantScreen(value: String, onValueChange: (String) -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var conversation by remember { mutableStateOf(GatewayClient.loadHistory(context)) }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf("") }
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Talk to TACT", color = Color.White, style = MaterialTheme.typography.headlineMedium)
        Text("Secure private HTTPS gateway connection. Recent conversation history is encrypted on this device.", color = Color.LightGray)
        conversation.forEach { message ->
            Card(colors = CardDefaults.cardColors(containerColor = if (message.role == "user") Color(0xFF24213B) else Color(0xFF1B2930))) {
                Column(Modifier.fillMaxWidth().padding(14.dp)) {
                    Text(if (message.role == "user") "YOU" else "TACT", color = Mint, style = MaterialTheme.typography.labelSmall)
                    Text(message.content, color = Color.White)
                }
            }
        }
        androidx.compose.material3.OutlinedTextField(
            value = value, onValueChange = onValueChange, modifier = Modifier.fillMaxWidth(),
            label = { Text("What would you like help with?") },
            minLines = 3
        )
        Button(onClick = {
            busy = true
            error = ""
            val prompt = value.trim()
            val outgoing = conversation + GatewayClient.ChatMessage("user", prompt)
            conversation = outgoing
            GatewayClient.saveHistory(context, outgoing)
            onValueChange("")
            scope.launch {
                try {
                    val response = withContext(Dispatchers.IO) { GatewayClient.chat(context, outgoing) }
                    conversation = outgoing + GatewayClient.ChatMessage("assistant", response)
                    GatewayClient.saveHistory(context, conversation)
                } catch (e: Exception) {
                    error = e.message ?: "Unable to reach the gateway."
                    conversation = outgoing.dropLast(1)
                    GatewayClient.saveHistory(context, conversation)
                    onValueChange(prompt)
                } finally {
                    busy = false
                }
            }
        }, enabled = value.isNotBlank() && !busy) {
            Text(if (busy) "Thinking…" else "Send to TACT")
        }
        if (error.isNotBlank()) Text(error, color = Color(0xFFFF9A9A))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(onClick = {
                conversation = emptyList()
                GatewayClient.clearHistory(context)
                error = ""
            }, enabled = conversation.isNotEmpty() && !busy) { Text("Clear conversation") }
        }
        Text("Messages are sent only when you press Send. History is encrypted on this device.", color = Mint,
            style = MaterialTheme.typography.bodySmall)
    }
}

@Composable
private fun GuardianScreen() {
    val context = LocalContext.current
    var snapshot by remember { mutableStateOf(DeviceDiagnostics.read(context)) }
    var scheduled by remember { mutableStateOf(GuardianHealthWorker.isEnabled(context)) }
    val healthPrefs = remember { context.getSharedPreferences("tact_guardian_health", android.content.Context.MODE_PRIVATE) }
    val lastCheck = healthPrefs.getLong("last_check_ms", 0L)
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(18.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Phone Guardian", color = Color.White, style = MaterialTheme.typography.headlineMedium)
        Text("${snapshot.manufacturer} ${snapshot.model} · Android ${snapshot.androidVersion}",
            color = Color.LightGray)
        FeatureCard("Battery", snapshot.batteryPercent?.let { "$it%" } ?: "Not available",
            if (snapshot.charging == true) "Charging" else "Refresh") {
            snapshot = DeviceDiagnostics.read(context)
        }
        FeatureCard("Available storage", String.format("%.1f GB", snapshot.availableStorageGb),
            "Refresh diagnostics") { snapshot = DeviceDiagnostics.read(context) }
        Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF1B2033))) {
            Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Scheduled health checks", color = Color.White, style = MaterialTheme.typography.titleMedium)
                Text("Optional local-only battery and storage checks every 6 hours. No microphone, messages, contacts or network access.", color = Color.LightGray)
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    androidx.compose.material3.Switch(checked = scheduled, onCheckedChange = { enabled ->
                        scheduled = enabled
                        if (enabled) GuardianHealthWorker.enable(context) else GuardianHealthWorker.disable(context)
                    })
                    Text(if (scheduled) "Scheduled checks enabled" else "Scheduled checks off", color = Mint)
                }
                Text(if (lastCheck > 0L) "Last check: ${java.util.Date(lastCheck)}" else "No scheduled check has run yet.",
                    color = Color.LightGray, style = MaterialTheme.typography.bodySmall)
            }
        }
        Text("Read-only diagnostics use public Android APIs. Scheduled checks are optional and can be switched off here.",
            color = Mint, style = MaterialTheme.typography.bodySmall)
    }
}

@Composable
private fun BuilderScreen() {
    val uriHandler = LocalUriHandler.current
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(18.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("App Builder & Integrations", color = Color.White, style = MaterialTheme.typography.headlineMedium)
        Text("Your AI tools, advertising workspace and build pipeline in one place.", color = Color.LightGray)
        Text("SERVICE DIRECTORY", color = Mint, style = MaterialTheme.typography.labelMedium)
        IntegrationCatalog.services.forEach { service ->
            Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF1B2033))) {
                Column(Modifier.fillMaxWidth().padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                        Text(service.name, color = Color.White, style = MaterialTheme.typography.titleMedium)
                        Text("Not connected", color = Color(0xFFFFC66D), style = MaterialTheme.typography.labelSmall)
                    }
                    Text(service.group.uppercase(), color = Mint, style = MaterialTheme.typography.labelSmall)
                    Text(service.purpose, color = Color.LightGray)
                    Text(service.setup, color = Color.LightGray, style = MaterialTheme.typography.bodySmall)
                    if (service.portalUrl != null) {
                        Button(onClick = { uriHandler.openUri(service.portalUrl) }) { Text("Open service") }
                    } else {
                        Text("Portal link not configured", color = Color(0xFFFFC66D), style = MaterialTheme.typography.labelSmall)
                    }
                }
            }
        }
        Text("Connection status is intentionally shown as Not connected until authorization and a successful test are completed. API keys belong in server-side secrets, never in the APK. Publishing, ad spend and other external changes must use the approval centre.",
            color = Mint, style = MaterialTheme.typography.bodySmall)
    }
}

@Composable
private fun SettingsScreen() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var approvals by remember { mutableStateOf(emptyList<GatewayClient.Approval>()) }
    var approvalStatus by remember { mutableStateOf("Approval queue not loaded.") }
    var approvalBusy by remember { mutableStateOf(false) }
    val existing = remember { GatewayClient.load(context) }
    var gatewayUrl by remember { mutableStateOf(existing.baseUrl) }
    var gatewayToken by remember { mutableStateOf(existing.token) }
    var status by remember { mutableStateOf(if (existing.baseUrl.isNotBlank()) "Gateway details saved on this device." else "Gateway not configured.") }
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Control & privacy", color = Color.White, style = MaterialTheme.typography.headlineMedium)
        Text("AI gateway connection", color = Color.White, style = MaterialTheme.typography.titleMedium)
        androidx.compose.material3.OutlinedTextField(value = gatewayUrl, onValueChange = { gatewayUrl = it },
            modifier = Modifier.fillMaxWidth(), label = { Text("HTTPS gateway URL") }, singleLine = true)
        androidx.compose.material3.OutlinedTextField(value = gatewayToken, onValueChange = { gatewayToken = it },
            modifier = Modifier.fillMaxWidth(), label = { Text("App access token") }, singleLine = true,
            visualTransformation = PasswordVisualTransformation())
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(onClick = {
                try {
                    GatewayClient.save(context, gatewayUrl, gatewayToken)
                    status = "Gateway saved; token encrypted with Android Keystore."
                } catch (e: Exception) {
                    status = e.message ?: "Could not save gateway settings."
                }
            }) { Text("Save securely") }
            Button(onClick = {
                GatewayClient.clear(context)
                gatewayUrl = ""
                gatewayToken = ""
                status = "Gateway credentials cleared from this device."
            }) { Text("Clear") }
        }
        Text(status, color = Mint, style = MaterialTheme.typography.bodySmall)
        Text("Approval centre", color = Color.White, style = MaterialTheme.typography.titleMedium)
        Text("Review queued requests. Recording approval or denial does not execute an action.", color = Color.LightGray)
        Button(onClick = {
            approvalBusy = true
            scope.launch {
                try {
                    approvals = withContext(Dispatchers.IO) { GatewayClient.loadApprovals(context) }
                    approvalStatus = "${approvals.size} request(s) loaded."
                } catch (e: Exception) {
                    approvalStatus = e.message ?: "Could not load approval queue."
                } finally { approvalBusy = false }
            }
        }, enabled = !approvalBusy) { Text(if (approvalBusy) "Loading…" else "Refresh approval queue") }
        Text(approvalStatus, color = Mint, style = MaterialTheme.typography.bodySmall)
        approvals.forEach { item ->
            Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF1B2033))) {
                Column(Modifier.fillMaxWidth().padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(item.action.replace('_', ' ').uppercase(), color = Mint, style = MaterialTheme.typography.labelMedium)
                    Text(item.summary, color = Color.White)
                    Text("Status: ${item.status}", color = Color.LightGray)
                    if (item.status == "awaiting_user_approval") {
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Button(onClick = {
                                scope.launch {
                                    approvalBusy = true
                                    try {
                                        withContext(Dispatchers.IO) { GatewayClient.decideApproval(context, item.id, "approved") }
                                        approvals = withContext(Dispatchers.IO) { GatewayClient.loadApprovals(context) }
                                        approvalStatus = "Approval decision recorded. No action executed."
                                    } catch (e: Exception) { approvalStatus = e.message ?: "Decision failed." }
                                    finally { approvalBusy = false }
                                }
                            }, enabled = !approvalBusy) { Text("Record approval") }
                            Button(onClick = {
                                scope.launch {
                                    approvalBusy = true
                                    try {
                                        withContext(Dispatchers.IO) { GatewayClient.decideApproval(context, item.id, "denied") }
                                        approvals = withContext(Dispatchers.IO) { GatewayClient.loadApprovals(context) }
                                        approvalStatus = "Denial recorded. No action executed."
                                    } catch (e: Exception) { approvalStatus = e.message ?: "Decision failed." }
                                    finally { approvalBusy = false }
                                }
                            }, enabled = !approvalBusy) { Text("Deny") }
                        }
                    }
                }
            }
        }
        FeatureCard("Privacy", "No contacts, messages, microphone or call data are accessed by this shell.", "View permissions") {}
        FeatureCard("AI connection", "Configure a server-side model provider; never embed API keys in the APK.", "Not connected") {}
    }
}
