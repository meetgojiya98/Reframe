import { describe, it, expect } from "vitest";
import {
  detectHighRiskText,
  detectHighRiskFromMessages,
  buildSafeResponse,
} from "./safety";

describe("detectHighRiskText", () => {
  it("returns null for empty or safe text", () => {
    expect(detectHighRiskText("")).toBeNull();
    expect(detectHighRiskText("   ")).toBeNull();
    expect(detectHighRiskText("I feel stressed today")).toBeNull();
    expect(detectHighRiskText("What evidence supports that?")).toBeNull();
  });

  it("returns self_harm_risk for self-harm related phrases", () => {
    expect(detectHighRiskText("I want to kill myself")).toBe("self_harm_risk");
    expect(detectHighRiskText("thinking about suicide")).toBe("self_harm_risk");
    expect(detectHighRiskText("I want to end my life")).toBe("self_harm_risk");
    expect(detectHighRiskText("no reason to live")).toBe("self_harm_risk");
  });

  it("returns violence_risk for violence toward others", () => {
    expect(detectHighRiskText("I want to kill them")).toBe("violence_risk");
    expect(detectHighRiskText("plan to harm someone")).toBe("violence_risk");
  });

  it("prioritizes self_harm over violence when both might match", () => {
    const text = "kill myself";
    expect(detectHighRiskText(text)).toBe("self_harm_risk");
  });
});

describe("detectHighRiskFromMessages", () => {
  it("returns null when no messages or only safe content", () => {
    expect(detectHighRiskFromMessages([])).toBeNull();
    expect(
      detectHighRiskFromMessages([
        { role: "user", content: "I'm anxious" },
        { role: "assistant", content: "That sounds hard." },
      ])
    ).toBeNull();
  });

  it("combines user and assistant content and detects risk", () => {
    expect(
      detectHighRiskFromMessages([
        { role: "system", content: "You are a coach." },
        { role: "user", content: "I keep thinking about suicide." },
      ])
    ).toBe("self_harm_risk");
  });
});

describe("buildSafeResponse", () => {
  it("returns a non-empty supportive message", () => {
    const msg = buildSafeResponse();
    expect(typeof msg).toBe("string");
    expect(msg.length).toBeGreaterThan(20);
    expect(msg.toLowerCase()).toContain("glad");
    expect(msg.toLowerCase()).toContain("reach");
  });
});
