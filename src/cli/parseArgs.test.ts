import { describe, it, expect } from "vitest";
import { parseArgs } from "./parseArgs.js";

describe("parseArgs", () => {
  it("parses a bare subject", () => {
    expect(parseArgs(["my product"])).toEqual({ subject: "my product" });
  });

  it("parses --count and --tone", () => {
    expect(
      parseArgs(["my product", "--count", "5", "--tone", "urgent"]),
    ).toEqual({ subject: "my product", count: 5, tone: "urgent" });
  });

  it("parses flags before the subject", () => {
    expect(parseArgs(["--count", "3", "my product"])).toEqual({
      subject: "my product",
      count: 3,
    });
  });

  it("throws when subject is missing", () => {
    expect(() => parseArgs([])).toThrow(/subject/i);
    expect(() => parseArgs(["--count", "3"])).toThrow(/subject/i);
  });

  it("throws when --count is not a positive integer", () => {
    expect(() => parseArgs(["x", "--count", "0"])).toThrow(/count/i);
    expect(() => parseArgs(["x", "--count", "-1"])).toThrow(/count/i);
    expect(() => parseArgs(["x", "--count", "abc"])).toThrow(/count/i);
    expect(() => parseArgs(["x", "--count", "2.5"])).toThrow(/count/i);
  });

  it("throws when --count or --tone is missing its value", () => {
    expect(() => parseArgs(["x", "--count"])).toThrow(/--count/);
    expect(() => parseArgs(["x", "--tone"])).toThrow(/--tone/);
  });

  it("throws on unknown flags", () => {
    expect(() => parseArgs(["x", "--bogus"])).toThrow(/Unknown flag/);
  });
});
