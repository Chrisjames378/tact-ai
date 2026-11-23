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
    var reply by remember { mutableStateOf("") }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf("") }
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Talk to TACT", color = Color.White, style = MaterialTheme.typography.headlineMedium)
        Text("Secure private HTTPS gateway connection. Provider keys stay server-side.", color = Color.LightGray)
        androidx.compose.material3.OutlinedTextField(
            value = value, onValueChange = onValueChange, modifier = Modifier.fillMaxWidth(),
            label = { Text("What would you like help with?") },
            minLines = 3
        )
        Button(onClick = {
            busy = true
            error = ""
            reply = ""
            val prompt = value.trim()
            scope.launch {
                try {
                    reply = withContext(Dispatchers.IO) { GatewayClient.chat(context, prompt) }
                    onValueChange("")
                } catch (e: Exception) {
                    error = e.message ?: "Unable to reach the gateway."
                } finally {
                    busy = false
                }
            }
        }, enabled = value.isNotBlank() && !busy) {
            Text(if (busy) "Thinking…" else "Send to TACT")
        }
        if (error.isNotBlank()) Text(error, color = Color(0xFFFF9A9A))
        if (reply.isNotBlank()) Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF24213B))) {
            Text(reply, color = Color.White, modifier = Modifier.padding(16.dp))
        }
        Text("Messages are sent only when you press Send. HTTPS is required.", color = Mint,
            style = MaterialTheme.typography.bodySmall)
    }
}

@Composable
private fun GuardianScreen() {
    val context = LocalContext.current
    var snapshot by remember { mutableStateOf(DeviceDiagnostics.read(context)) }
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
        Text("Read-only diagnostics use public Android APIs. More monitoring will be added only with clear permissions.",
            color = Mint, style = MaterialTheme.typography.bodySmall)
    }
}

@Composable
private fun BuilderScreen() {
    Column(Modifier.fillMaxSize().padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("App Builder", color = Color.White, style = MaterialTheme.typography.headlineMedium)
        Text("Your coding and deployment workspace.", color = Color.LightGray)
        FeatureCard("GitHub", "Repository access and code review.", "Integration pending") {}
        FeatureCard("Deployments", "Vercel, Railway and Render status.", "Integration pending") {}
        FeatureCard("Databases", "Supabase and Neon project diagnostics.", "Integration pending") {}
    }
}

@Composable
private fun SettingsScreen() {
    val context = LocalContext.current
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
        FeatureCard("Approval centre", "Sensitive actions must be reviewed before execution.", "Enabled") {}
        FeatureCard("Privacy", "No contacts, messages, microphone or call data are accessed by this shell.", "View permissions") {}
        FeatureCard("AI connection", "Configure a server-side model provider; never embed API keys in the APK.", "Not connected") {}
    }
}
