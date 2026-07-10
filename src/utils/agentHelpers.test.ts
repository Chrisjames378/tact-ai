import { describe, it, expect } from "vitest";
import { 
  calculateMaintenanceScore, 
  sanitizeErrorText, 
  formatAgentPrompt 
} from "./agentHelpers";

describe("Tact AI Agent Helpers Tests", () => {
  describe("calculateMaintenanceScore", () => {
    it("should return 100 for optimal parameters", () => {
      const score = calculateMaintenanceScore(100, 30, 0);
      expect(score).toBe(100);
    });

    it("should deduct score for high network latency", () => {
      const normalScore = calculateMaintenanceScore(100, 30, 0);
      const laggyScore = calculateMaintenanceScore(100, 150, 0);
      expect(laggyScore).toBeLessThan(normalScore);
    });

    it("should deduct significantly for error count logs", () => {
      const healthyScore = calculateMaintenanceScore(90, 20, 0);
      const faultyScore = calculateMaintenanceScore(90, 20, 2);
      expect(faultyScore).toBe(healthyScore - 30);
    });

    it("should clamp scores between 10 and 100", () => {
      const absoluteWorst = calculateMaintenanceScore(5, 1000, 10);
      expect(absoluteWorst).toBe(10);
    });
  });

  describe("sanitizeErrorText", () => {
    it("should redact API keys correctly", () => {
      const rawText = "Unauthorized access attempt using AIzaSyByP1_someFakeApiKeyStrHereExample";
      const sanitized = sanitizeErrorText(rawText);
      expect(sanitized).toContain("[REDACTED_API_KEY]");
      expect(sanitized).not.toContain("AIzaSyByP1_someFakeApiKeyStrHereExample");
    });

    it("should mask local file paths for environment privacy", () => {
      const winTrace = "Exception in C:\\Users\\Administrator\\App.tsx: line 42";
      const unixTrace = "Exception in /home/workspace/App.tsx: line 42";
      
      expect(sanitizeErrorText(winTrace)).toContain("...\\App.tsx");
      expect(sanitizeErrorText(unixTrace)).toContain(".../App.tsx");
    });
  });

  describe("formatAgentPrompt", () => {
    it("should output standard logging headers and stringified payload", () => {
      const result = formatAgentPrompt("helix", "audit", { errorCount: 3, resolved: false });
      expect(result).toContain("[AGENT_SYS_LOG: HELIX]");
      expect(result).toContain("[ACTION: AUDIT]");
      expect(result).toContain("errorCount: 3");
    });
  });
});
