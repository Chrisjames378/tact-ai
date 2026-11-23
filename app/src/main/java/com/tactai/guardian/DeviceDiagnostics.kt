package com.tactai.guardian

import android.content.Context
import android.os.BatteryManager
import android.os.Environment
import android.os.StatFs
import android.os.Build

data class DeviceSnapshot(
    val manufacturer: String,
    val model: String,
    val androidVersion: String,
    val batteryPercent: Int?,
    val charging: Boolean?,
    val availableStorageGb: Double
)

object DeviceDiagnostics {
    fun read(context: Context): DeviceSnapshot {
        val batteryManager = context.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
        val battery = batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
            .takeIf { it in 0..100 }
        val charging = batteryManager.isCharging
        val dataPath = Environment.getDataDirectory()
        val stats = StatFs(dataPath.path)
        val availableBytes = stats.availableBlocksLong * stats.blockSizeLong
        val availableGb = availableBytes.toDouble() / (1024.0 * 1024.0 * 1024.0)

        return DeviceSnapshot(
            manufacturer = Build.MANUFACTURER.orEmpty(),
            model = Build.MODEL.orEmpty(),
            androidVersion = Build.VERSION.RELEASE.orEmpty(),
            batteryPercent = battery,
            charging = charging,
            availableStorageGb = availableGb
        )
    }
}
