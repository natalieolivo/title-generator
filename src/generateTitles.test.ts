import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const generateWithAnthropicMock = vi.fn();

vi.mock("./providers/anthropic.js", () => ({
  generateWithAnthropic: generateWithAnthropicMock,
}));

// Import after mocking so the module under test picks up the mocked provider.
const { generateTitles } = await import("./generateTitles.js");

describe("generateTitles", () => {
  const ORIGINAL_ENV = process.env["ANTHROPIC_API_KEY"];

  beforeEach(() => {
    generateWithAnthropicMock.mockReset();
    process.env["ANTHROPIC_API_KEY"] = "test-key";
  });

  afterEach(() => {
    if (ORIGINAL_ENV === undefined) {
      delete process.env["ANTHROPIC_API_KEY"];
    } else {
      process.env["ANTHROPIC_API_KEY"] = ORIGINAL_ENV;
    }
  });

  it("throws when subject is empty", async () => {
    await expect(generateTitles({ subject: "" })).rejects.toThrow(
      /subject/i,
    );
    await expect(generateTitles({ subject: "   " })).rejects.toThrow(
      /subject/i,
    );
    expect(generateWithAnthropicMock).not.toHaveBeenCalled();
  });

  it("throws when count is zero, negative, or non-integer", async () => {
    await expect(
      generateTitles({ subject: "widget", count: 0 }),
    ).rejects.toThrow(/count/i);
    await expect(
      generateTitles({ subject: "widget", count: -3 }),
    ).rejects.toThrow(/count/i);
    await expect(
      generateTitles({ subject: "widget", count: 2.5 }),
    ).rejects.toThrow(/count/i);
    expect(generateWithAnthropicMock).not.toHaveBeenCalled();
  });

  it("throws a clear error mentioning ANTHROPIC_API_KEY when unset", async () => {
    delete process.env["ANTHROPIC_API_KEY"];
    await expect(generateTitles({ subject: "widget" })).rejects.toThrow(
      /ANTHROPIC_API_KEY/,
    );
    expect(generateWithAnthropicMock).not.toHaveBeenCalled();
  });

  it("calls the provider with the right params and returns its result", async () => {
    generateWithAnthropicMock.mockResolvedValue([
      "Title One",
      "Title Two",
    ]);

    const result = await generateTitles({
      subject: "a new productivity app",
      count: 2,
      tone: "playful",
    });

    expect(generateWithAnthropicMock).toHaveBeenCalledWith({
      subject: "a new productivity app",
      count: 2,
      tone: "playful",
    });
    expect(result).toEqual(["Title One", "Title Two"]);
  });

  it("defaults count to 4 and omits tone when not provided", async () => {
    generateWithAnthropicMock.mockResolvedValue(["a", "b", "c", "d"]);

    await generateTitles({ subject: "a blog post about cats" });

    expect(generateWithAnthropicMock).toHaveBeenCalledWith({
      subject: "a blog post about cats",
      count: 4,
      tone: undefined,
    });
  });
});
