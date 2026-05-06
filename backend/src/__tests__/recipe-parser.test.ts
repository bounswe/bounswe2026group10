// Unit tests for the recipe-parser service. Specifically verifies the
// transparent retry logic around Gemini, since the route-level tests
// mock parseRecipeText wholesale and don't exercise the internals.

jest.mock("../config/gemini.js", () => {
  // Stable model object so every call to getGenerativeModel returns the
  // same generateContent mock — required to assert call counts across
  // retry attempts.
  const generateContent = jest.fn();
  const mockModel = { generateContent };
  return {
    genAI: { getGenerativeModel: jest.fn(() => mockModel) },
    GEMINI_MODEL: "gemini-test",
  };
});

import { genAI } from "../config/gemini.js";
import { parseRecipeText } from "../services/recipe-parser.js";

const getGenerateContentMock = (): jest.Mock => {
  const model = genAI.getGenerativeModel({} as any) as unknown as {
    generateContent: jest.Mock;
  };
  return model.generateContent;
};

const mockSuccessResponse = () => ({
  response: {
    text: () =>
      JSON.stringify({
        title: "Test Recipe",
        ingredients: [{ name: "flour", quantity: 1, unit: "cup" }],
        steps: [{ stepOrder: 1, description: "Mix it." }],
        tools: [{ name: "bowl" }],
      }),
  },
});

describe("parseRecipeText retry behavior", () => {
  beforeEach(() => {
    getGenerateContentMock().mockReset();
  });

  it("returns the parsed recipe on first attempt when Gemini succeeds", async () => {
    const generateContent = getGenerateContentMock();
    generateContent.mockResolvedValueOnce(mockSuccessResponse());

    const result = await parseRecipeText("a recipe long enough to pass min length");

    expect(result.title).toBe("Test Recipe");
    expect(generateContent).toHaveBeenCalledTimes(1);
  });

  it("retries when Gemini throws and succeeds on the second attempt", async () => {
    const generateContent = getGenerateContentMock();
    generateContent
      .mockRejectedValueOnce(new Error("Gemini transient 500"))
      .mockResolvedValueOnce(mockSuccessResponse());

    const result = await parseRecipeText("another long-enough recipe text");

    expect(result.title).toBe("Test Recipe");
    expect(generateContent).toHaveBeenCalledTimes(2);
  });

  it("retries when Gemini returns malformed JSON and succeeds on a later attempt", async () => {
    const generateContent = getGenerateContentMock();
    generateContent
      .mockResolvedValueOnce({ response: { text: () => "not-json-at-all {{" } })
      .mockResolvedValueOnce(mockSuccessResponse());

    const result = await parseRecipeText("another long-enough recipe text");

    expect(result.title).toBe("Test Recipe");
    expect(generateContent).toHaveBeenCalledTimes(2);
  });

  it("gives up after 3 attempts and surfaces the last error", async () => {
    const generateContent = getGenerateContentMock();
    generateContent
      .mockRejectedValueOnce(new Error("fail 1"))
      .mockRejectedValueOnce(new Error("fail 2"))
      .mockRejectedValueOnce(new Error("fail 3 final"));

    await expect(parseRecipeText("another long-enough recipe text")).rejects.toThrow(
      "fail 3 final"
    );
    expect(generateContent).toHaveBeenCalledTimes(3);
  });
});
