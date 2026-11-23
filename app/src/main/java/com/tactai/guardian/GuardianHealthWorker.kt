package com.tactai.guardian

import android.content.Context
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.Worker
import androidx.work.WorkerParameters
import java.util.concurrent.TimeUnit

class GuardianHealthWorker(context: Context, params: WorkerParameters) : Worker(context, params) {
    override fun doWork(): Result = try {
        val snapshot = DeviceDiagnostics.read(applicationContext)
        applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putInt("battery_percent", snapshot.batteryPercent ?: -1)
            .putFloat("available_storage_gb", snapshot.availableStorageGb.toFloat())
            .putLong("last_check_ms", System.currentTimeMillis())
            .apply()
        Result.success()
    } catch (_: Exception) {
        Result.retry()
    }

    companion object {
        private const val PREFS = "tact_guardian_health"
        private const val UNIQUE_WORK = "tact_guardian_periodic_health"

        fun enable(context: Context) {
            val request = PeriodicWorkRequestBuilder<GuardianHealthWorker>(6, TimeUnit.HOURS).build()
            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                UNIQUE_WORK, ExistingPeriodicWorkPolicy.UPDATE, request
            )
        }

        fun disable(context: Context) {
            WorkManager.getInstance(context).cancelUniqueWork(UNIQUE_WORK)
        }

        fun isEnabled(context: Context): Boolean =
            WorkManager.getInstance(context).getWorkInfosForUniqueWork(UNIQUE_WORK).get()
                .any { !it.state.isFinished }
    }
}
