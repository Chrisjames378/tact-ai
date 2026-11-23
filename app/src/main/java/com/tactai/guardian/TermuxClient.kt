package com.tactai.guardian

import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

object TermuxClient {
    private const val HEALTH_URL = "http://localhost:8765/health"

    fun checkHealth(): String {
        val connection = (URL(HEALTH_URL).openConnection() as HttpURLConnection).apply {
            requestMethod = "GET"
            connectTimeout = 2500
            readTimeout = 2500
        }
        try {
            val code = connection.responseCode
            val body = (if (code in 200..299) connection.inputStream else connection.errorStream)
                ?.bufferedReader()?.use { it.readText() }.orEmpty()
            if (code !in 200..299) throw IllegalStateException("Termux companion returned HTTP $code.")
            val json = JSONObject(body)
            if (json.optString("status") != "ok" ||
                json.optString("service") != "tact-termux-companion") {
                throw IllegalStateException("A service responded, but it was not the TACT Termux companion.")
            }
            return "Connected · " + json.optString("service") + " v" + json.optString("version")
        } finally {
            connection.disconnect()
        }
    }
}
