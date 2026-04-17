import { describe, it, expect } from "vitest";
import {
  isApprovalPhrase,
  shortCircuitApprovalIfNeeded,
  getFirstHumanText,
} from "../src/nodes/utils.js";
import { HumanMessage } from "@langchain/core/messages";

describe("isApprovalPhrase", () => {
  it("matches standalone yes and approve keywords", () => {
    expect(isApprovalPhrase("yes")).toBe(true);
    expect(isApprovalPhrase("approve")).toBe(true);
    expect(isApprovalPhrase("Please proceed")).toBe(true);
  });

  it("does not treat planning copy as approval", () => {
    expect(
      isApprovalPhrase("yes, plan a trip to Paris for next week")
    ).toBe(false);
  });
});

describe("getFirstHumanText", () => {
  it("returns the first human message", () => {
    expect(
      getFirstHumanText([
        new HumanMessage("original task"),
        new HumanMessage("approve"),
      ])
    ).toBe("original task");
  });
});

describe("shortCircuitApprovalIfNeeded", () => {
  it("returns approval when plan exists and user sends approve", () => {
    const state = {
      messages: [new HumanMessage("approve")],
      currentStep: "planning",
      pendingApproval: {
        approved: false,
        planText: "my plan",
      },
    };
    const r = shortCircuitApprovalIfNeeded(state);
    expect(r?.approved).toBe(true);
  });
});
