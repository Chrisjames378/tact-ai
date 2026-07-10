export interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  diagnostics?: DiagnosticData;
}

export interface DiagnosticData {
  battery?: {
    level: number;
    charging: boolean;
    supported: boolean;
  };
  network?: {
    latencyMs: number;
    jitterMs: number;
    connectionType: string;
    downlinkMb: number;
    testedAt: string;
  };
  screen?: {
    width: number;
    height: number;
    colorDepth: number;
    pixelRatio: number;
  };
  audio?: {
    speakerTested: boolean;
    frequenciesTested: number[];
  };
  browser?: {
    userAgent: string;
    platform: string;
    language: string;
  };
}

export type ToolType = "mic_analyzer" | "speaker_test" | "pixel_test" | "network_test" | "system_info" | "device_fixer" | "node_upgrade" | "vires_shield" | "stress_test" | "thermal_map";
