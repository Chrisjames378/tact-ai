package com.tactai.guardian

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

/** HTTPS-only gateway client. The access token is encrypted with Android Keystore. */
object GatewayClient {
    private const val PREFS = "tact_guardian_secure"
    private const val KEY_ALIAS = "tact_guardian_gateway_v1"
    data class Config(val baseUrl: String, val token: String)
    data class ChatMessage(val role: String, val content: String)

    fun loadHistory(context: Context): List<ChatMessage> {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val encrypted = prefs.getString("history_cipher", null) ?: return emptyList()
        val iv = prefs.getString("history_iv", null) ?: return emptyList()
        return try {
            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            cipher.init(Cipher.DECRYPT_MODE, getKey(), GCMParameterSpec(128, android.util.Base64.decode(iv, android.util.Base64.NO_WRAP)))
            val plain = String(cipher.doFinal(android.util.Base64.decode(encrypted, android.util.Base64.NO_WRAP)), Charsets.UTF_8)
            val array = org.json.JSONArray(plain)
            (0 until array.length()).map { i ->
                val item = array.getJSONObject(i)
                ChatMessage(item.getString("role"), item.getString("content"))
            }
        } catch (_: Exception) { emptyList() }
    }

    fun saveHistory(context: Context, messages: List<ChatMessage>) {
        val array = org.json.JSONArray()
        messages.takeLast(40).forEach { array.put(JSONObject().put("role", it.role).put("content", it.content)) }
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, getKey())
        val encrypted = android.util.Base64.encodeToString(cipher.doFinal(array.toString().toByteArray(Charsets.UTF_8)), android.util.Base64.NO_WRAP)
        val iv = android.util.Base64.encodeToString(cipher.iv, android.util.Base64.NO_WRAP)
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putString("history_cipher", encrypted).putString("history_iv", iv).apply()
    }

    fun clearHistory(context: Context) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .remove("history_cipher").remove("history_iv").apply()
    }

    fun load(context: Context): Config {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val url = prefs.getString("base_url", "") ?: ""
        val encrypted = prefs.getString("token_cipher", null)
        val iv = prefs.getString("token_iv", null)
        val token = if (encrypted != null && iv != null) try {
            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            cipher.init(Cipher.DECRYPT_MODE, getKey(), GCMParameterSpec(128, android.util.Base64.decode(iv, android.util.Base64.NO_WRAP)))
            String(cipher.doFinal(android.util.Base64.decode(encrypted, android.util.Base64.NO_WRAP)), Charsets.UTF_8)
        } catch (_: Exception) { "" } else ""
        return Config(url, token)
    }

    fun save(context: Context, baseUrl: String, token: String) {
        val normalized = baseUrl.trim().trimEnd('/')
        require(normalized.startsWith("https://")) { "Use an HTTPS gateway URL." }
        require(token.isNotBlank()) { "Gateway token cannot be empty." }
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, getKey())
        val encrypted = android.util.Base64.encodeToString(cipher.doFinal(token.toByteArray(Charsets.UTF_8)), android.util.Base64.NO_WRAP)
        val iv = android.util.Base64.encodeToString(cipher.iv, android.util.Base64.NO_WRAP)
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putString("base_url", normalized).putString("token_cipher", encrypted).putString("token_iv", iv).apply()
    }

    fun clear(context: Context) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().clear().apply()
    }

    fun chat(context: Context, messages: List<ChatMessage>): String {
        val config = load(context)
        require(config.baseUrl.startsWith("https://") && config.token.isNotBlank()) {
            "Configure your HTTPS gateway URL and access token in Settings first."
        }
        val payloadMessages = JSONArray()
        messages.takeLast(20).forEach { item ->
            payloadMessages.put(JSONObject().put("role", item.role).put("content", item.content))
        }
        val payload = JSONObject().put("messages", payloadMessages).toString()
        val connection = (URL(config.baseUrl + "/v1/chat").openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            connectTimeout = 15000
            readTimeout = 60000
            doOutput = true
            setRequestProperty("Content-Type", "application/json")
            setRequestProperty("Authorization", "Bearer " + config.token)
        }
        try {
            connection.outputStream.use { it.write(payload.toByteArray(Charsets.UTF_8)) }
            val code = connection.responseCode
            val stream = if (code in 200..299) connection.inputStream else connection.errorStream
            val body = stream?.bufferedReader()?.use { it.readText() }.orEmpty()
            val json = JSONObject(body.ifBlank { "{}" })
            if (code !in 200..299) throw IllegalStateException(json.optString("error", "Gateway request failed (HTTP " + code + ")."))
            return json.optString("reply").ifBlank { "The assistant returned an empty response." }
        } finally {
            connection.disconnect()
        }
    }

    private fun getKey(): SecretKey {
        val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        (keyStore.getKey(KEY_ALIAS, null) as? SecretKey)?.let { return it }
        val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
        generator.init(KeyGenParameterSpec.Builder(KEY_ALIAS, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setRandomizedEncryptionRequired(true).build())
        return generator.generateKey()
    }
}
