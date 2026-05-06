import request from "supertest";
import app from "../index.js";
import { supabase } from "../config/supabase.js";

// ─── Mock Supabase ────────────────────────────────────────────────────────────

jest.mock("../config/supabase.js", () => {
  const mockFrom = jest.fn();

  return {
    supabase: {
      auth: { getUser: jest.fn() },
      from: mockFrom,
    },
    createUserClient: jest.fn(() => ({ from: mockFrom })),
  };
});

// ─── Mock Gemini (recipe-parser service) ──────────────────────────────────────

jest.mock("../services/recipe-parser.js", () => ({
  parseRecipeText: jest.fn(),
  standardizeUnits: jest.fn(),
}));

// ─── Mock ElevenLabs (transcription service) ──────────────────────────────────

jest.mock("../services/transcription.js", () => ({
  transcribeAudio: jest.fn(),
}));

import { parseRecipeText, standardizeUnits } from "../services/recipe-parser.js";
import { transcribeAudio } from "../services/transcription.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const setupAuthMock = (role: string, profileId = "profile-123") => {
  (supabase.auth.getUser as jest.Mock).mockResolvedValue({
    data: { user: { id: "user-123", email: "test@example.com" } },
    error: null,
  });

  (supabase.from as jest.Mock).mockImplementation((table) => {
    if (table === "profiles") {
      const mockSingle = jest.fn().mockResolvedValue({
        data: { id: profileId, username: "tester", role },
        error: null,
      });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      return { select: jest.fn().mockReturnValue({ eq: mockEq }) };
    }
    return { select: jest.fn(), insert: jest.fn() };
  });
};

const validPayload = {
  text: "Take 2 cups of flour, 1 egg, and mix them together. Knead the dough for 10 minutes using a rolling pin. Bake in the oven at 350F for 20 minutes.",
};

const mockParsedResult = {
  title: "Simple Bread",
  ingredients: [
    { name: "flour", quantity: 2, unit: "cups" },
    { name: "egg", quantity: 1, unit: "piece" },
  ],
  steps: [
    { stepOrder: 1, description: "Mix flour and egg together." },
    { stepOrder: 2, description: "Knead the dough for 10 minutes." },
    { stepOrder: 3, description: "Bake in the oven at 350°F for 20 minutes." },
  ],
  tools: [
    { name: "rolling pin" },
    { name: "oven" },
  ],
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /parse/recipe-text", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 if not authenticated", async () => {
    const res = await request(app)
      .post("/parse/recipe-text")
      .send(validPayload);

    expect(res.status).toBe(401);
  });

  it("returns 403 if user is a learner", async () => {
    setupAuthMock("learner");

    const res = await request(app)
      .post("/parse/recipe-text")
      .set("Authorization", "Bearer valid_token")
      .send(validPayload);

    expect(res.status).toBe(403);
    expect(res.body.error.message).toContain("roles: cook, expert");
  });

  it("returns 400 if text is missing", async () => {
    setupAuthMock("cook");

    const res = await request(app)
      .post("/parse/recipe-text")
      .set("Authorization", "Bearer valid_token")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 if text is too short", async () => {
    setupAuthMock("cook");

    const res = await request(app)
      .post("/parse/recipe-text")
      .set("Authorization", "Bearer valid_token")
      .send({ text: "short" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.message).toContain("at least 10");
  });

  it("returns 400 if text exceeds max length", async () => {
    setupAuthMock("cook");

    const res = await request(app)
      .post("/parse/recipe-text")
      .set("Authorization", "Bearer valid_token")
      .send({ text: "a".repeat(5001) });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.message).toContain("at most 5000");
  });

  it("returns 200 with parsed recipe for a cook", async () => {
    setupAuthMock("cook");
    (parseRecipeText as jest.Mock).mockResolvedValue(mockParsedResult);

    const res = await request(app)
      .post("/parse/recipe-text")
      .set("Authorization", "Bearer valid_token")
      .send(validPayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe("Simple Bread");
    expect(res.body.data.ingredients).toHaveLength(2);
    expect(res.body.data.ingredients[0].name).toBe("flour");
    expect(res.body.data.ingredients[0].quantity).toBe(2);
    expect(res.body.data.ingredients[0].unit).toBe("cups");
    expect(res.body.data.steps).toHaveLength(3);
    expect(res.body.data.steps[0].stepOrder).toBe(1);
    expect(res.body.data.tools).toHaveLength(2);
    expect(res.body.data.tools[0].name).toBe("rolling pin");
    expect(parseRecipeText).toHaveBeenCalledWith(validPayload.text);
  });

  it("returns 200 with parsed recipe for an expert", async () => {
    setupAuthMock("expert");
    (parseRecipeText as jest.Mock).mockResolvedValue(mockParsedResult);

    const res = await request(app)
      .post("/parse/recipe-text")
      .set("Authorization", "Bearer valid_token")
      .send(validPayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe("Simple Bread");
  });

  it("returns 500 if parser service fails", async () => {
    setupAuthMock("cook");
    (parseRecipeText as jest.Mock).mockRejectedValue(new Error("Gemini API timeout"));

    const res = await request(app)
      .post("/parse/recipe-text")
      .set("Authorization", "Bearer valid_token")
      .send(validPayload);

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("PARSE_FAILED");
    expect(res.body.error.message).toContain("Failed to parse");
  });
});

// ─── POST /parse/standardize-units ──────────────────────────────────────────

const standardizePayload = {
  ingredients: [
    { name: "flour", quantity: 1, unit: "tea glass" },
    { name: "sugar", quantity: 1, unit: "pinch" },
  ],
  steps: [
    { stepOrder: 1, description: "Hamuru kulak memesi kıvamına getirin." },
    { stepOrder: 2, description: "Göz kararı tuz ekleyin." },
  ],
  region: "Turkey",
};

const mockStandardizedResult = {
  ingredients: [
    {
      name: "flour",
      originalQuantity: 1,
      originalUnit: "tea glass",
      standardQuantity: 100,
      standardUnit: "ml",
    },
    {
      name: "sugar",
      originalQuantity: 1,
      originalUnit: "pinch",
      standardQuantity: 1,
      standardUnit: "g",
    },
  ],
  steps: [
    {
      stepOrder: 1,
      originalDescription: "Hamuru kulak memesi kıvamına getirin.",
      standardDescription: "Knead the dough until it is soft and smooth, similar to the texture of an earlobe (not sticky, slightly firm).",
    },
    {
      stepOrder: 2,
      originalDescription: "Göz kararı tuz ekleyin.",
      standardDescription: "Add salt approximately to your preference.",
    },
  ],
};

describe("POST /parse/standardize-units", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 if not authenticated", async () => {
    const res = await request(app)
      .post("/parse/standardize-units")
      .send(standardizePayload);

    expect(res.status).toBe(401);
  });

  it("returns 403 if user is a learner", async () => {
    setupAuthMock("learner");

    const res = await request(app)
      .post("/parse/standardize-units")
      .set("Authorization", "Bearer valid_token")
      .send(standardizePayload);

    expect(res.status).toBe(403);
  });

  it("returns 400 if ingredients array is empty", async () => {
    setupAuthMock("cook");

    const res = await request(app)
      .post("/parse/standardize-units")
      .set("Authorization", "Bearer valid_token")
      .send({ ingredients: [] });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 if ingredients is missing", async () => {
    setupAuthMock("cook");

    const res = await request(app)
      .post("/parse/standardize-units")
      .set("Authorization", "Bearer valid_token")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 200 with standardized ingredients and steps", async () => {
    setupAuthMock("cook");
    (standardizeUnits as jest.Mock).mockResolvedValue(mockStandardizedResult);

    const res = await request(app)
      .post("/parse/standardize-units")
      .set("Authorization", "Bearer valid_token")
      .send(standardizePayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ingredients).toHaveLength(2);
    expect(res.body.data.ingredients[0].originalUnit).toBe("tea glass");
    expect(res.body.data.ingredients[0].standardQuantity).toBe(100);
    expect(res.body.data.ingredients[0].standardUnit).toBe("ml");
    expect(res.body.data.steps).toHaveLength(2);
    expect(res.body.data.steps[0].originalDescription).toContain("kulak memesi");
    expect(res.body.data.steps[0].standardDescription).toContain("earlobe");
    expect(standardizeUnits).toHaveBeenCalledWith(
      standardizePayload.ingredients,
      standardizePayload.steps,
      "Turkey"
    );
  });

  it("works without steps and region", async () => {
    setupAuthMock("expert");
    (standardizeUnits as jest.Mock).mockResolvedValue({
      ingredients: mockStandardizedResult.ingredients,
      steps: [],
    });

    const res = await request(app)
      .post("/parse/standardize-units")
      .set("Authorization", "Bearer valid_token")
      .send({ ingredients: standardizePayload.ingredients });

    expect(res.status).toBe(200);
    expect(res.body.data.ingredients).toHaveLength(2);
    expect(res.body.data.steps).toHaveLength(0);
    expect(standardizeUnits).toHaveBeenCalledWith(
      standardizePayload.ingredients,
      undefined,
      undefined
    );
  });

  it("returns 500 if standardization service fails", async () => {
    setupAuthMock("cook");
    (standardizeUnits as jest.Mock).mockRejectedValue(new Error("Gemini timeout"));

    const res = await request(app)
      .post("/parse/standardize-units")
      .set("Authorization", "Bearer valid_token")
      .send(standardizePayload);

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("STANDARDIZATION_FAILED");
  });
});

// ─── POST /parse/recipe-audio ────────────────────────────────────────────────

const mockTranscriptionEn = {
  text: "Take two cups of flour, one egg, and mix them together. Knead the dough for ten minutes using a rolling pin. Bake in the oven at 350F for 20 minutes.",
  languageCode: "eng",
  languageProbability: 0.99,
};

const mockTranscriptionTr = {
  text: "İki su bardağı un, bir yumurta alın ve karıştırın. Hamuru on dakika yoğurun ve fırında pişirin.",
  languageCode: "tur",
  languageProbability: 0.97,
};

describe("POST /parse/recipe-audio", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 if not authenticated", async () => {
    const res = await request(app)
      .post("/parse/recipe-audio")
      .attach("audio", Buffer.from("fake audio bytes"), {
        filename: "recipe.mp3",
        contentType: "audio/mpeg",
      });

    expect(res.status).toBe(401);
  });

  it("returns 403 if user is a learner", async () => {
    setupAuthMock("learner");

    const res = await request(app)
      .post("/parse/recipe-audio")
      .set("Authorization", "Bearer valid_token")
      .attach("audio", Buffer.from("fake audio bytes"), {
        filename: "recipe.mp3",
        contentType: "audio/mpeg",
      });

    expect(res.status).toBe(403);
    expect(res.body.error.message).toContain("roles: cook, expert");
  });

  it("returns 400 if no audio file is provided", async () => {
    setupAuthMock("cook");

    const res = await request(app)
      .post("/parse/recipe-audio")
      .set("Authorization", "Bearer valid_token");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("MISSING_FILE");
  });

  it("returns 400 for unsupported file type", async () => {
    setupAuthMock("cook");

    const res = await request(app)
      .post("/parse/recipe-audio")
      .set("Authorization", "Bearer valid_token")
      .attach("audio", Buffer.from("not really audio"), {
        filename: "fake.txt",
        contentType: "text/plain",
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_FILE_TYPE");
  });

  it("returns 400 if transcription is too short to parse", async () => {
    setupAuthMock("cook");
    (transcribeAudio as jest.Mock).mockResolvedValue({
      text: "hi",
      languageCode: "eng",
      languageProbability: 0.5,
    });

    const res = await request(app)
      .post("/parse/recipe-audio")
      .set("Authorization", "Bearer valid_token")
      .attach("audio", Buffer.from("fake audio bytes"), {
        filename: "recipe.mp3",
        contentType: "audio/mpeg",
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("TRANSCRIPTION_TOO_SHORT");
  });

  it("returns 500 if transcription service fails", async () => {
    setupAuthMock("cook");
    (transcribeAudio as jest.Mock).mockRejectedValue(new Error("ElevenLabs 429"));

    const res = await request(app)
      .post("/parse/recipe-audio")
      .set("Authorization", "Bearer valid_token")
      .attach("audio", Buffer.from("fake audio bytes"), {
        filename: "recipe.mp3",
        contentType: "audio/mpeg",
      });

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("TRANSCRIPTION_FAILED");
  });

  it("returns 500 if parser fails after a successful transcription", async () => {
    setupAuthMock("cook");
    (transcribeAudio as jest.Mock).mockResolvedValue(mockTranscriptionEn);
    (parseRecipeText as jest.Mock).mockRejectedValue(new Error("Gemini timeout"));

    const res = await request(app)
      .post("/parse/recipe-audio")
      .set("Authorization", "Bearer valid_token")
      .attach("audio", Buffer.from("fake audio bytes"), {
        filename: "recipe.mp3",
        contentType: "audio/mpeg",
      });

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("PARSE_FAILED");
  });

  it("returns 200 with transcription + structured recipe (English, auto-detect)", async () => {
    setupAuthMock("cook");
    (transcribeAudio as jest.Mock).mockResolvedValue(mockTranscriptionEn);
    (parseRecipeText as jest.Mock).mockResolvedValue(mockParsedResult);

    const res = await request(app)
      .post("/parse/recipe-audio")
      .set("Authorization", "Bearer valid_token")
      .attach("audio", Buffer.from("fake audio bytes"), {
        filename: "recipe.mp3",
        contentType: "audio/mpeg",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.transcription.text).toBe(mockTranscriptionEn.text);
    expect(res.body.data.transcription.languageCode).toBe("eng");
    expect(res.body.data.transcription.truncated).toBe(false);
    expect(res.body.data.transcription.source).toBe("audio");
    expect(res.body.data.recipe.title).toBe("Simple Bread");
    expect(res.body.data.recipe.ingredients).toHaveLength(2);
    expect(res.body.data.recipe.steps).toHaveLength(3);

    // Auto-detect should pass language="auto" to the transcription service.
    expect(transcribeAudio).toHaveBeenCalledWith(
      expect.any(Buffer),
      "audio/mpeg",
      "recipe.mp3",
      "auto"
    );
    // Parser is invoked with the raw transcription text.
    expect(parseRecipeText).toHaveBeenCalledWith(mockTranscriptionEn.text);
  });

  it("accepts an MP4 video and tags the source as 'video'", async () => {
    setupAuthMock("expert");
    (transcribeAudio as jest.Mock).mockResolvedValue(mockTranscriptionEn);
    (parseRecipeText as jest.Mock).mockResolvedValue(mockParsedResult);

    const res = await request(app)
      .post("/parse/recipe-audio")
      .set("Authorization", "Bearer valid_token")
      .attach("audio", Buffer.from("fake mp4 bytes"), {
        filename: "cooking.mp4",
        contentType: "video/mp4",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.transcription.source).toBe("video");
    expect(transcribeAudio).toHaveBeenCalledWith(
      expect.any(Buffer),
      "video/mp4",
      "cooking.mp4",
      "auto"
    );
  });

  it("accepts a MOV video", async () => {
    setupAuthMock("expert");
    (transcribeAudio as jest.Mock).mockResolvedValue(mockTranscriptionTr);
    (parseRecipeText as jest.Mock).mockResolvedValue(mockParsedResult);

    const res = await request(app)
      .post("/parse/recipe-audio")
      .set("Authorization", "Bearer valid_token")
      .field("language", "tr")
      .attach("audio", Buffer.from("fake mov bytes"), {
        filename: "tarif.mov",
        contentType: "video/quicktime",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.transcription.source).toBe("video");
    expect(res.body.data.transcription.languageCode).toBe("tur");
  });

  it("forwards the language hint when caller specifies tr", async () => {
    setupAuthMock("expert");
    (transcribeAudio as jest.Mock).mockResolvedValue(mockTranscriptionTr);
    (parseRecipeText as jest.Mock).mockResolvedValue(mockParsedResult);

    const res = await request(app)
      .post("/parse/recipe-audio")
      .set("Authorization", "Bearer valid_token")
      .field("language", "tr")
      .attach("audio", Buffer.from("fake turkish audio"), {
        filename: "tarif.m4a",
        contentType: "audio/m4a",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.transcription.languageCode).toBe("tur");
    expect(transcribeAudio).toHaveBeenCalledWith(
      expect.any(Buffer),
      "audio/m4a",
      "tarif.m4a",
      "tr"
    );
  });

  it("ignores invalid language values and falls back to auto-detect", async () => {
    setupAuthMock("cook");
    (transcribeAudio as jest.Mock).mockResolvedValue(mockTranscriptionEn);
    (parseRecipeText as jest.Mock).mockResolvedValue(mockParsedResult);

    const res = await request(app)
      .post("/parse/recipe-audio")
      .set("Authorization", "Bearer valid_token")
      .field("language", "klingon")
      .attach("audio", Buffer.from("fake audio"), {
        filename: "recipe.wav",
        contentType: "audio/wav",
      });

    expect(res.status).toBe(200);
    expect(transcribeAudio).toHaveBeenCalledWith(
      expect.any(Buffer),
      "audio/wav",
      "recipe.wav",
      "auto"
    );
  });

  it("truncates very long transcriptions before passing to the parser", async () => {
    setupAuthMock("cook");
    const longText = "a".repeat(5500);
    (transcribeAudio as jest.Mock).mockResolvedValue({
      text: longText,
      languageCode: "eng",
      languageProbability: 0.95,
    });
    (parseRecipeText as jest.Mock).mockResolvedValue(mockParsedResult);

    const res = await request(app)
      .post("/parse/recipe-audio")
      .set("Authorization", "Bearer valid_token")
      .attach("audio", Buffer.from("fake audio"), {
        filename: "long.mp3",
        contentType: "audio/mpeg",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.transcription.truncated).toBe(true);
    // Parser receives only the first 5000 characters.
    const [parserArg] = (parseRecipeText as jest.Mock).mock.calls[0];
    expect(parserArg).toHaveLength(5000);
    // But the response still exposes the full transcription so the user can see it.
    expect(res.body.data.transcription.text).toHaveLength(5500);
  });
});
