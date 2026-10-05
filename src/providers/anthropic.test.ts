import { describe, it, expect, vi, beforeEach } from "vitest";

const createMock = vi.fn();

vi.mock("@anthropic-ai/sdk", () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: createMock },
  })),
}));

// Import after mocking so the module under test picks up the mocked SDK.
const { generateWithAnthropic } = await import("./anthropic.js");

function textResponse(body: unknown) {
  return { content: [{ type: "text", text: JSON.stringify(body) }] };
}

describe("generateWithAnthropic", () => {
  beforeEach(() => {
    createMock.mockReset();
  });

  it("returns the variants parsed from the response's text block", async () => {
    createMock.mockResolvedValue(
      textResponse({ variants: ["Title One", "Title Two"] }),
    );

    const result = await generateWithAnthropic({
      subject: "a productivity app",
      count: 2,
    });

    expect(result).toEqual(["Title One", "Title Two"]);
  });

  it("sends subject and count in the prompt, and a json_schema output config", async () => {
    createMock.mockResolvedValue(textResponse({ variants: ["a", "b", "c"] }));

    await generateWithAnthropic({ subject: "a productivity app", count: 3 });

    expect(createMock).toHaveBeenCalledTimes(1);
    const call = createMock.mock.calls[0]?.[0];

    expect(call.messages).toEqual([
      {
        role: "user",
        content: expect.stringContaining(
          'Write 3 distinct titles for "a productivity app".',
        ),
      },
    ]);
    expect(call.output_config).toEqual({
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            variants: { type: "array", items: { type: "string" } },
          },
          required: ["variants"],
          additionalProperties: false,
        },
      },
    });
  });

  it("defaults to the four-angle instruction when tone is omitted", async () => {
    createMock.mockResolvedValue(textResponse({ variants: ["a"] }));

    await generateWithAnthropic({ subject: "widget", count: 1 });

    const prompt = createMock.mock.calls[0]?.[0].messages[0].content;
    expect(prompt).toMatch(/benefit-driven/i);
    expect(prompt).toMatch(/curiosity-driven/i);
    expect(prompt).toMatch(/social-proof/i);
    expect(prompt).toMatch(/urgency/i);
  });

  it("uses tone as a stylistic hint instead of the four-angle default when provided", async () => {
    createMock.mockResolvedValue(textResponse({ variants: ["a"] }));

    await generateWithAnthropic({
      subject: "widget",
      count: 1,
      tone: "playful",
    });

    const prompt = createMock.mock.calls[0]?.[0].messages[0].content;
    expect(prompt).toMatch(/playful/);
    expect(prompt).not.toMatch(/benefit-driven/i);
  });

  it("throws a clear error when the response has no text content block", async () => {
    createMock.mockResolvedValue({
      content: [{ type: "tool_use", id: "x", name: "y", input: {} }],
    });

    await expect(
      generateWithAnthropic({ subject: "widget", count: 1 }),
    ).rejects.toThrow(/no text content block/i);
  });

  it("throws a clear error when the response has no content blocks at all", async () => {
    createMock.mockResolvedValue({ content: [] });

    await expect(
      generateWithAnthropic({ subject: "widget", count: 1 }),
    ).rejects.toThrow(/no text content block/i);
  });

  it("throws a clear error when the parsed JSON doesn't match the expected shape", async () => {
    createMock.mockResolvedValue(textResponse({ titles: ["a", "b"] }));

    await expect(
      generateWithAnthropic({ subject: "widget", count: 1 }),
    ).rejects.toThrow(/did not match the expected/i);
  });

  it("throws a clear error when variants contains non-string entries", async () => {
    createMock.mockResolvedValue(textResponse({ variants: ["a", 2, "c"] }));

    await expect(
      generateWithAnthropic({ subject: "widget", count: 1 }),
    ).rejects.toThrow(/did not match the expected/i);
  });
});
