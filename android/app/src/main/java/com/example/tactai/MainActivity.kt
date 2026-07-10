package com.example.tactai

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.view.animation.Animation
import android.view.animation.ScaleAnimation
import android.widget.Button
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import ai.picovoice.porcupine.*
import java.util.*

class MainActivity : AppCompatActivity(), TextToSpeech.OnInitListener {

    private val REQUEST_RECORD_AUDIO_PERMISSION = 200
    private var permissionToRecordAccepted = false
    private val permissions = arrayOf(Manifest.permission.RECORD_AUDIO)

    // UI elements
    private lateinit var tvStatus: TextView
    private lateinit var tvResult: TextView
    private lateinit var btnMic: ImageView
    private lateinit var btnToggleWake: Button
    private lateinit var tvWakeStatus: TextView

    // Speech and Wake Word Engines
    private var speechRecognizer: SpeechRecognizer? = null
    private var recognizerIntent: Intent? = null
    private var porcupineManager: PorcupineManager? = null
    private var textToSpeech: TextToSpeech? = null

    // Configuration
    // Replace with your personal Access Key from Picovoice Console (https://console.picovoice.ai/)
    private val PICOVOICE_ACCESS_KEY = "YOUR_PICOVOICE_ACCESS_KEY_HERE" 
    private var isWakeWordActive = true
    private var isRecording = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Bind UI Elements
        tvStatus = findViewById(R.id.tvStatus)
        tvResult = findViewById(R.id.tvResult)
        btnMic = findViewById(R.id.btnMic)
        btnToggleWake = findViewById(R.id.btnToggleWake)
        tvWakeStatus = findViewById(R.id.tvWakeStatus)

        // Initialize Text To Speech for local vocal feedback
        textToSpeech = TextToSpeech(this, this)

        // Request runtime permission for microphone recording (mandatory from Android 6.0+)
        requestMicrophonePermission()

        // Set up click listeners
        btnMic.setOnClickListener {
            if (isRecording) {
                stopVoiceRecognition()
            } else {
                startVoiceRecognition()
            }
        }

        btnToggleWake.setOnClickListener {
            toggleWakeWordDetection()
        }

        setupSpeechRecognizer()
    }

    private fun requestMicrophonePermission() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
            permissionToRecordAccepted = true
            initWakeWordDetection()
        } else {
            ActivityCompat.requestPermissions(this, permissions, REQUEST_RECORD_AUDIO_PERMISSION)
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        permissionToRecordAccepted = if (requestCode == REQUEST_RECORD_AUDIO_PERMISSION) {
            grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED
        } else {
            false
        }
        if (permissionToRecordAccepted) {
            initWakeWordDetection()
        } else {
            Toast.makeText(this, "Microphone permission required for Tact AI voice features.", Toast.LENGTH_LONG).show()
            tvStatus.text = "PERMISSION RESTRICTED"
        }
    }

    private fun setupSpeechRecognizer() {
        if (SpeechRecognizer.isRecognitionAvailable(this)) {
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this)
            recognizerIntent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault())
                putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
            }

            speechRecognizer?.setRecognitionListener(object : RecognitionListener {
                override fun onReadyForSpeech(params: Bundle?) {
                    isRecording = true
                    runOnUiThread {
                        tvStatus.text = "Listening to input..."
                        animateMicPulse(true)
                    }
                }

                override fun onBeginningOfSpeech() {}
                
                override fun onRmsChanged(rmsdB: Float) {
                    // Dynamically scale mic core size based on active audio amplitude (oscilloscope mirroring)
                    val scale = 1.0f + (rmsdB / 14.0f).coerceIn(0.0f, 0.4f)
                    btnMic.scaleX = scale
                    btnMic.scaleY = scale
                }

                override fun onBufferReceived(buffer: ByteArray?) {}
                
                override fun onEndOfSpeech() {
                    runOnUiThread {
                        tvStatus.text = "Processing voice..."
                        animateMicPulse(false)
                    }
                }

                override fun onError(error: Int) {
                    isRecording = false
                    val message = when (error) {
                        SpeechRecognizer.ERROR_AUDIO -> "Audio record failure"
                        SpeechRecognizer.ERROR_CLIENT -> "Client subsystem error"
                        SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Mic permission required"
                        SpeechRecognizer.ERROR_NETWORK -> "Network dispatch failed"
                        SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Network speed timeout"
                        SpeechRecognizer.ERROR_NO_MATCH -> "No speech matching word"
                        SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Service active and busy"
                        SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "Voice timeout"
                        else -> "Capture terminated"
                    }
                    runOnUiThread {
                        tvStatus.text = "Awaiting Voice Input"
                        tvResult.text = "[$message]"
                        btnMic.scaleX = 1.0f
                        btnMic.scaleY = 1.0f
                    }
                    // Release and re-engage the Porcupine Wake Word listener
                    restartWakeWordDetection()
                }

                override fun onResults(results: Bundle?) {
                    isRecording = false
                    val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                    if (!matches.isNullOrEmpty()) {
                        val spokenText = matches[0]
                        runOnUiThread {
                            tvResult.text = spokenText
                            processTextCommand(spokenText)
                        }
                    } else {
                        runOnUiThread { tvStatus.text = "Awaiting Voice Input" }
                    }
                    // Release and re-engage the Porcupine Wake Word listener
                    restartWakeWordDetection()
                }

                override fun onPartialResults(partialResults: Bundle?) {
                    val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                    if (!matches.isNullOrEmpty()) {
                        runOnUiThread {
                            tvResult.text = matches[0]
                        }
                    }
                }

                override fun onEvent(eventType: Int, params: Bundle?) {}
            })
        } else {
            tvResult.text = "[Google Speech Recognition unavailable on this device]"
        }
    }

    private fun initWakeWordDetection() {
        if (!permissionToRecordAccepted) return

        try {
            // For a custom wake word like 'Hey Tact', you generate a custom keyword file 'hey_tact_android.ppn'
            // and save it in your project's assets folder (src/main/assets/hey_tact_android.ppn).
            // Below, we set up Picovoice Porcupine to load this custom wake-word path.
            // If the custom keyword file hasn't been bundled yet, we fallback gracefully to Picovoice's default keyword.
            
            val builder = PorcupineManager.Builder()
                .setAccessKey(PICOVOICE_ACCESS_KEY)

            // Dynamic check for custom assets
            val assetList = assets.list("") ?: emptyArray()
            if (assetList.contains("hey_tact_android.ppn")) {
                builder.setKeywordPath("hey_tact_android.ppn")
            } else {
                // Graceful fallback to standard built-in keyword (e.g., 'PORCUPINE')
                builder.setKeyword(Porcupine.BuiltInKeyword.PORCUPINE)
            }

            porcupineManager = builder.build(this) { keywordIndex ->
                // Wake word detected! Stop Porcupine to free mic and launch Android Speech-to-Text
                runOnUiThread {
                    Toast.makeText(this, "Hey Tact detected!", Toast.LENGTH_SHORT).show()
                    speakFeedback("Tact listening.")
                    startVoiceRecognition()
                }
            }

            if (isWakeWordActive) {
                porcupineManager?.start()
                tvWakeStatus.text = "Wake Word: Hey Tact ACTIVE"
            }
        } catch (e: Exception) {
            tvWakeStatus.text = "Wake Word: Inactive (Demo Fallback)"
            e.printStackTrace()
        }
    }

    private fun startVoiceRecognition() {
        // MUST release mic from Picovoice before SpeechRecognizer can capture audio stream
        stopWakeWordDetection()

        runOnUiThread {
            try {
                speechRecognizer?.startListening(recognizerIntent)
            } catch (e: Exception) {
                tvStatus.text = "Mic Core Fault"
                tvResult.text = "Could not start audio listener: ${e.message}"
                restartWakeWordDetection()
            }
        }
    }

    private fun stopVoiceRecognition() {
        speechRecognizer?.stopListening()
        animateMicPulse(false)
    }

    private fun stopWakeWordDetection() {
        try {
            porcupineManager?.stop()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun restartWakeWordDetection() {
        if (isWakeWordActive && permissionToRecordAccepted) {
            try {
                porcupineManager?.start()
                runOnUiThread {
                    tvWakeStatus.text = "Wake Word: Hey Tact ACTIVE"
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    private fun toggleWakeWordDetection() {
        if (isWakeWordActive) {
            isWakeWordActive = false
            stopWakeWordDetection()
            tvWakeStatus.text = "Wake Word: MONITOR OFF"
            btnToggleWake.text = "Enable Background Listening"
        } else {
            isWakeWordActive = true
            initWakeWordDetection()
            btnToggleWake.text = "Disable Background Listening"
        }
    }

    private fun processTextCommand(command: String) {
        val lower = command.lowercase()
        val response = when {
            lower.contains("engine") || lower.contains("schematic") -> {
                "Analyzing engine diagrams. Primary alternator voltage and ignition coils are within range."
            }
            lower.contains("battery") || lower.contains("drain") -> {
                "Telemetry diagnostics online. Current battery cells are performing at optimal capacity."
            }
            lower.contains("test") -> {
                "Running self diagnostics sequence. Voice, audio, and network sub systems report active status."
            }
            else -> {
                "Command received: $command. Dispatched to central processor."
            }
        }
        
        speakFeedback(response)
        tvStatus.text = "Awaiting Voice Input"
    }

    private fun speakFeedback(text: String) {
        textToSpeech?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "TactSpeechID")
    }

    private fun animateMicPulse(start: Boolean) {
        if (start) {
            val pulse = ScaleAnimation(
                1.0f, 1.15f, 1.0f, 1.15f,
                Animation.RELATIVE_TO_SELF, 0.5f,
                Animation.RELATIVE_TO_SELF, 0.5f
            ).apply {
                duration = 800
                repeatMode = Animation.REVERSE
                repeatCount = Animation.INFINITE
            }
            btnMic.startAnimation(pulse)
        } else {
            btnMic.clearAnimation()
            btnMic.scaleX = 1.0f
            btnMic.scaleY = 1.0f
        }
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            textToSpeech?.language = Locale.US
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        speechRecognizer?.destroy()
        porcupineManager?.delete()
        textToSpeech?.shutdown()
    }
}
