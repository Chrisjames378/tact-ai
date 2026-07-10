/**
 * Utility to proxy repair logs to Google Sheets via server-side endpoint
 */
export const logRepairToGoogleSheets = async (
  token: string,
  deviceName: string,
  issue: string,
  repairLogs: string,
  status: string = "REPAIRED"
): Promise<{ success: boolean; spreadsheetId?: string; message: string }> => {
  try {
    const res = await fetch("/api/sheets/log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-user-access-token": token,
      },
      body: JSON.stringify({
        deviceName,
        issue,
        repairLogs,
        status,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || `HTTP ${res.status} returned from server`);
    }

    return await res.json();
  } catch (error: any) {
    console.error("[Sheets Logger] Error sending log to sheets endpoint:", error);
    throw error;
  }
};
