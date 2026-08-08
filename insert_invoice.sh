sed -i '/{activeTool === "stress_test" && (/i \
        {activeTool === "invoice" && (\
          <InvoiceTab \
            logs={stressLogs} \
            report={stressReport} \
            deviceName={devices[activeDeviceIdx]?.name || "Unknown Device"} \
            token={googleToken} \
          />\
        )}' src/components/RepairToolbox.tsx
