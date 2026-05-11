/**
 * Tests for the translation feature:
 * - translateRecipe() service function (translationService.ts)
 * - GET /recipes/:id?lang= endpoint
 * - POST /recipes/:id/publish — 401, 409 edge cases and translation trigger
 */

import request from "supertest";
import app from "../index.js";
import { supabase } from "../config/supabase.js";
import * as translationService from "../services/translationService.js";
import { Translator } from "deepl-node";

// ─── Module Mocks ─────────────────────────────────────────────────────────────

jest.mock("deepl-node", () => ({
  Translator: jest.fn(),
}));

jest.mock("../config/supabase.js", () => {
  const mockFrom = jest.fn();
  return {
    supabase: { auth: { getUser: jest.fn() }, from: mockFrom },
    createUserClient: jest.fn(() => ({ from: mockFrom })),
  };
});

const MockTranslator = Translator as jest.MockedClass<typeof Translator>;

// ─── Chain Helper ─────────────────────────────────────────────────────────────

/**
 * Builds a chainable Supabase query mock that resolves to `resolved`.
 * Supports .select(), .eq(), .in(), .order(), .update(), .delete() (return this),
 * and .single(), .maybeSingle(), .upsert() (return Promises).
 */
const chain = (resolved: { data: any; error: any }) => {
  const obj: any = {};
  ["select", "eq", "in", "order", "update", "delete"].forEach((m) => {
    obj[m] = jest.fn().mockReturnValue(obj);
  });
  obj.single = jest.fn().mockResolvedValue(resolved);
  obj.maybeSingle = jest.fn().mockResolvedValue(resolved);
  obj.upsert = jest.fn().mockResolvedValue(resolved);
  // Make the object itself awaitable (for chains ending without .single())
  obj.then = (resolve: any) => Promise.resolve(resolved).then(resolve);
  return obj;
};

// ─── translateRecipe() ────────────────────────────────────────────────────────

describe("translateRecipe()", () => {
  const RECIPE_ID = "recipe-uuid-1";

  const DEFAULT_RECIPE = { title: "Chocolate Cake", story: "A delicious cake." };
  const DEFAULT_STEPS = [
    { id: "step-1", description: "Mix flour." },
    { id: "step-2", description: "Bake at 180°C." },
  ];
  const DEFAULT_INGREDIENTS = [
    { id: "ing-1", unit: "cup" },
    { id: "ing-2", unit: "tbsp" },
  ];

  let mockTranslateText: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env["DEEPL_API_KEY"] = "test-api-key";
    mockTranslateText = jest.fn();
    MockTranslator.mockImplementation(() => ({ translateText: mockTranslateText } as any));
  });

  afterEach(() => {
    delete process.env["DEEPL_API_KEY"];
  });

  const DEFAULT_TOOLS = [
    { id: "tool-1", name: "Oven" },
    { id: "tool-2", name: "Bowl" },
  ];

  /** Sets up supabase.from with default table responses, accepting per-table overrides. */
  const setupDb = (overrides: {
    recipe?: any;
    recipeError?: any;
    steps?: any[];
    ingredients?: any[];
    tools?: any[];
  } = {}) => {
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      switch (table) {
        case "recipes":
          return chain({
            data: overrides.recipe ?? DEFAULT_RECIPE,
            error: overrides.recipeError ?? null,
          });
        case "recipe_steps":
          return chain({ data: overrides.steps ?? DEFAULT_STEPS, error: null });
        case "recipe_ingredients":
          return chain({ data: overrides.ingredients ?? DEFAULT_INGREDIENTS, error: null });
        case "recipe_tools":
          return chain({ data: overrides.tools ?? DEFAULT_TOOLS, error: null });
        default:
          return chain({ data: null, error: null });
      }
    });
  };

  // ─── Early exits ─────────────────────────────────────────────────────────────

  it("skips silently when DEEPL_API_KEY is not set", async () => {
    delete process.env["DEEPL_API_KEY"];
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await translationService.translateRecipe(RECIPE_ID);
    expect(MockTranslator).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("returns early when recipe fetch fails", async () => {
    setupDb({ recipeError: { message: "DB timeout" } });
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await translationService.translateRecipe(RECIPE_ID);
    expect(mockTranslateText).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("returns early when DeepL language detection fails", async () => {
    setupDb();
    mockTranslateText.mockRejectedValue(new Error("DeepL unavailable"));
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await translationService.translateRecipe(RECIPE_ID);
    // Only the detection call was attempted
    expect(mockTranslateText).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it("returns early when DeepL translation batch call fails", async () => {
    setupDb();
    mockTranslateText
      .mockResolvedValueOnce({ text: "Çikolatalı Kek", detectedSourceLang: "en" })
      .mockRejectedValueOnce(new Error("Translation batch error"));
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await translationService.translateRecipe(RECIPE_ID);
    expect(mockTranslateText).toHaveBeenCalledTimes(2);
    spy.mockRestore();
  });

  // ─── EN → TR ─────────────────────────────────────────────────────────────────

  it("translates an English recipe to Turkish — second DeepL call targets 'tr'", async () => {
    setupDb();
    mockTranslateText
      .mockResolvedValueOnce({ text: "Çikolatalı Kek", detectedSourceLang: "en" })
      .mockResolvedValueOnce([
        { text: "Çikolatalı Kek" },
        { text: "Lezzetli bir pasta." },
        { text: "Unu karıştırın." },
        { text: "180°C'de pişirin." },
      ]);

    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await translationService.translateRecipe(RECIPE_ID);

    expect(mockTranslateText).toHaveBeenCalledTimes(2);
    expect(mockTranslateText.mock.calls[1]?.[2]).toBe("tr");
    spy.mockRestore();
  });

  it("upserts recipe_translations with language_code TR after EN→TR translation", async () => {
    setupDb();
    mockTranslateText
      .mockResolvedValueOnce({ text: "Çikolatalı Kek", detectedSourceLang: "en" })
      .mockResolvedValueOnce([
        { text: "Çikolatalı Kek" },
        { text: "Lezzetli bir pasta." },
        { text: "Unu karıştırın." },
        { text: "180°C'de pişirin." },
      ]);

    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await translationService.translateRecipe(RECIPE_ID);

    // recipe_translations must have been called
    const transTableCalls = (supabase.from as jest.Mock).mock.calls.filter(
      ([t]: [string]) => t === "recipe_translations"
    );
    expect(transTableCalls.length).toBeGreaterThan(0);
    spy.mockRestore();
  });

  // ─── TR → EN ─────────────────────────────────────────────────────────────────

  it("translates a Turkish recipe to English — second DeepL call targets 'en-US'", async () => {
    setupDb({ recipe: { title: "Çikolatalı Kek", story: "Lezzetli bir pasta." } });
    mockTranslateText
      .mockResolvedValueOnce({ text: "Chocolate Cake", detectedSourceLang: "tr" })
      .mockResolvedValueOnce([
        { text: "A delicious cake." },
        { text: "Mix flour." },
        { text: "Bake at 180°C." },
      ]);

    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await translationService.translateRecipe(RECIPE_ID);

    expect(mockTranslateText).toHaveBeenCalledTimes(2);
    expect(mockTranslateText.mock.calls[1]?.[2]).toBe("en-US");
    spy.mockRestore();
  });

  it("reuses the detected EN title as translatedTitle for TR→EN (no redundant DeepL call)", async () => {
    setupDb({ recipe: { title: "Çikolatalı Kek", story: null } });
    mockTranslateText
      .mockResolvedValueOnce({ text: "Chocolate Cake", detectedSourceLang: "tr" })
      .mockResolvedValueOnce([
        { text: "Mix flour." },
        { text: "Bake at 180°C." },
      ]);

    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await translationService.translateRecipe(RECIPE_ID);

    // Detection call also provides the EN title — only 2 total DeepL calls
    expect(mockTranslateText).toHaveBeenCalledTimes(2);
    // Second call should NOT include the title (already translated by detection)
    const textsArg: string[] = mockTranslateText.mock.calls[1]?.[0];
    expect(textsArg).not.toContain("Çikolatalı Kek");
    spy.mockRestore();
  });

  // ─── Unit mapping ─────────────────────────────────────────────────────────────

  it("maps EN→TR units correctly: cup→bardak, tbsp→yemek kaşığı, tsp→çay kaşığı, pinch→tutam", async () => {
    const upsertMock = jest.fn().mockResolvedValue({ error: null });

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "recipes") return chain({ data: DEFAULT_RECIPE, error: null });
      if (table === "recipe_steps") return chain({ data: DEFAULT_STEPS, error: null });
      if (table === "recipe_ingredients")
        return chain({
          data: [
            { id: "ing-1", unit: "cup" },
            { id: "ing-2", unit: "tbsp" },
            { id: "ing-3", unit: "tsp" },
            { id: "ing-4", unit: "pinch" },
          ],
          error: null,
        });
      if (table === "recipe_ingredient_translations") return { upsert: upsertMock };
      return chain({ data: null, error: null });
    });

    mockTranslateText
      .mockResolvedValueOnce({ text: "Çikolatalı Kek", detectedSourceLang: "en" })
      .mockResolvedValueOnce([
        { text: "Çikolatalı Kek" },
        { text: "Lezzetli bir pasta." },
        { text: "Unu karıştırın." },
        { text: "180°C'de pişirin." },
      ]);

    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await translationService.translateRecipe(RECIPE_ID);

    expect(upsertMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ recipe_ingredient_id: "ing-1", language_code: "TR", unit: "bardak" }),
        expect.objectContaining({ recipe_ingredient_id: "ing-2", language_code: "TR", unit: "yemek kaşığı" }),
        expect.objectContaining({ recipe_ingredient_id: "ing-3", language_code: "TR", unit: "çay kaşığı" }),
        expect.objectContaining({ recipe_ingredient_id: "ing-4", language_code: "TR", unit: "tutam" }),
      ]),
      expect.anything()
    );
    spy.mockRestore();
  });

  it("maps TR→EN units correctly: bardak→cup, yemek kaşığı→tbsp, tutam→pinch", async () => {
    const upsertMock = jest.fn().mockResolvedValue({ error: null });

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "recipes") return chain({ data: { title: "Çikolatalı Kek", story: null }, error: null });
      if (table === "recipe_steps") return chain({ data: DEFAULT_STEPS, error: null });
      if (table === "recipe_ingredients")
        return chain({
          data: [
            { id: "ing-1", unit: "bardak" },
            { id: "ing-2", unit: "yemek kaşığı" },
            { id: "ing-3", unit: "tutam" },
          ],
          error: null,
        });
      if (table === "recipe_ingredient_translations") return { upsert: upsertMock };
      return chain({ data: null, error: null });
    });

    mockTranslateText
      .mockResolvedValueOnce({ text: "Chocolate Cake", detectedSourceLang: "tr" })
      .mockResolvedValueOnce([{ text: "Mix flour." }, { text: "Bake at 180°C." }]);

    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await translationService.translateRecipe(RECIPE_ID);

    expect(upsertMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ recipe_ingredient_id: "ing-1", language_code: "EN", unit: "cup" }),
        expect.objectContaining({ recipe_ingredient_id: "ing-2", language_code: "EN", unit: "tbsp" }),
        expect.objectContaining({ recipe_ingredient_id: "ing-3", language_code: "EN", unit: "pinch" }),
      ]),
      expect.anything()
    );
    spy.mockRestore();
  });

  it("leaves identity units (g, kg, ml) unchanged when translating EN→TR", async () => {
    const upsertMock = jest.fn().mockResolvedValue({ error: null });

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "recipes") return chain({ data: DEFAULT_RECIPE, error: null });
      if (table === "recipe_steps") return chain({ data: DEFAULT_STEPS, error: null });
      if (table === "recipe_ingredients")
        return chain({
          data: [
            { id: "ing-1", unit: "g" },
            { id: "ing-2", unit: "kg" },
            { id: "ing-3", unit: "ml" },
          ],
          error: null,
        });
      if (table === "recipe_ingredient_translations") return { upsert: upsertMock };
      return chain({ data: null, error: null });
    });

    mockTranslateText
      .mockResolvedValueOnce({ text: "Çikolatalı Kek", detectedSourceLang: "en" })
      .mockResolvedValueOnce([
        { text: "Çikolatalı Kek" },
        { text: "Lezzetli bir pasta." },
        { text: "Unu karıştırın." },
        { text: "180°C'de pişirin." },
      ]);

    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await translationService.translateRecipe(RECIPE_ID);

    expect(upsertMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ unit: "g" }),
        expect.objectContaining({ unit: "kg" }),
        expect.objectContaining({ unit: "ml" }),
      ]),
      expect.anything()
    );
    spy.mockRestore();
  });

  it("leaves unknown units unchanged", async () => {
    const upsertMock = jest.fn().mockResolvedValue({ error: null });

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "recipes") return chain({ data: { title: "Pasta", story: null }, error: null });
      if (table === "recipe_steps") return chain({ data: [], error: null });
      if (table === "recipe_ingredients")
        return chain({ data: [{ id: "ing-1", unit: "handful_of_love" }], error: null });
      if (table === "recipe_ingredient_translations") return { upsert: upsertMock };
      return chain({ data: null, error: null });
    });

    mockTranslateText
      .mockResolvedValueOnce({ text: "Makarna", detectedSourceLang: "en" })
      .mockResolvedValueOnce([{ text: "Makarna" }]);

    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await translationService.translateRecipe(RECIPE_ID);

    expect(upsertMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ unit: "handful_of_love" }),
      ]),
      expect.anything()
    );
    spy.mockRestore();
  });

  // ─── Edge cases ───────────────────────────────────────────────────────────────

  it("handles recipe with no story — story is excluded from DeepL batch", async () => {
    setupDb({ recipe: { title: "Pasta", story: null }, tools: [] });
    mockTranslateText
      .mockResolvedValueOnce({ text: "Makarna", detectedSourceLang: "en" })
      .mockResolvedValueOnce([
        { text: "Makarna" },         // title
        { text: "Unu karıştırın." }, // step 1
        { text: "180°C'de pişirin." }, // step 2
      ]);

    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await translationService.translateRecipe(RECIPE_ID);

    // Second call: [title, step1, step2] — no story, no tools → 3 items
    const textsArg: string[] = mockTranslateText.mock.calls[1]?.[0];
    expect(textsArg).toHaveLength(3);
    spy.mockRestore();
  });

  it("handles recipe with no steps — skips recipe_step_translations upsert", async () => {
    setupDb({ steps: [] });
    mockTranslateText
      .mockResolvedValueOnce({ text: "Çikolatalı Kek", detectedSourceLang: "en" })
      .mockResolvedValueOnce([{ text: "Çikolatalı Kek" }, { text: "Lezzetli bir pasta." }]);

    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await translationService.translateRecipe(RECIPE_ID);

    const stepTransCalls = (supabase.from as jest.Mock).mock.calls.filter(
      ([t]: [string]) => t === "recipe_step_translations"
    );
    expect(stepTransCalls).toHaveLength(0);
    spy.mockRestore();
  });

  it("handles recipe with no ingredients — skips recipe_ingredient_translations upsert", async () => {
    setupDb({ ingredients: [] });
    mockTranslateText
      .mockResolvedValueOnce({ text: "Çikolatalı Kek", detectedSourceLang: "en" })
      .mockResolvedValueOnce([
        { text: "Çikolatalı Kek" },
        { text: "Lezzetli bir pasta." },
        { text: "Unu karıştırın." },
        { text: "180°C'de pişirin." },
      ]);

    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await translationService.translateRecipe(RECIPE_ID);

    const ingTransCalls = (supabase.from as jest.Mock).mock.calls.filter(
      ([t]: [string]) => t === "recipe_ingredient_translations"
    );
    expect(ingTransCalls).toHaveLength(0);
    spy.mockRestore();
  });

  // ─── Tool translation ─────────────────────────────────────────────────────────

  it("includes tool names in the DeepL batch after steps", async () => {
    setupDb({ tools: [{ id: "tool-1", name: "Oven" }] });
    mockTranslateText
      .mockResolvedValueOnce({ text: "Çikolatalı Kek", detectedSourceLang: "en" })
      .mockResolvedValueOnce([
        { text: "Çikolatalı Kek" },
        { text: "Lezzetli bir pasta." },
        { text: "Unu karıştırın." },
        { text: "180°C'de pişirin." },
        { text: "Fırın" },
      ]);

    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await translationService.translateRecipe(RECIPE_ID);

    const textsArg: string[] = mockTranslateText.mock.calls[1]?.[0];
    expect(textsArg).toContain("Oven");
    // Tool comes after steps
    expect(textsArg.indexOf("Oven")).toBeGreaterThan(textsArg.indexOf("Bake at 180°C."));
    spy.mockRestore();
  });

  it("upserts translated tool names to recipe_tool_translations", async () => {
    const upsertMock = jest.fn().mockResolvedValue({ error: null });

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "recipes") return chain({ data: DEFAULT_RECIPE, error: null });
      if (table === "recipe_steps") return chain({ data: DEFAULT_STEPS, error: null });
      if (table === "recipe_ingredients") return chain({ data: DEFAULT_INGREDIENTS, error: null });
      if (table === "recipe_tools")
        return chain({ data: [{ id: "tool-1", name: "Oven" }], error: null });
      if (table === "recipe_tool_translations") return { upsert: upsertMock };
      return chain({ data: null, error: null });
    });

    mockTranslateText
      .mockResolvedValueOnce({ text: "Çikolatalı Kek", detectedSourceLang: "en" })
      .mockResolvedValueOnce([
        { text: "Çikolatalı Kek" },
        { text: "Lezzetli bir pasta." },
        { text: "Unu karıştırın." },
        { text: "180°C'de pişirin." },
        { text: "Fırın" },
      ]);

    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await translationService.translateRecipe(RECIPE_ID);

    expect(upsertMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ recipe_tool_id: "tool-1", language_code: "TR", name: "Fırın" }),
      ]),
      expect.anything()
    );
    spy.mockRestore();
  });

  it("skips recipe_tool_translations upsert when recipe has no tools", async () => {
    setupDb({ tools: [] });
    mockTranslateText
      .mockResolvedValueOnce({ text: "Çikolatalı Kek", detectedSourceLang: "en" })
      .mockResolvedValueOnce([
        { text: "Çikolatalı Kek" },
        { text: "Lezzetli bir pasta." },
        { text: "Unu karıştırın." },
        { text: "180°C'de pişirin." },
      ]);

    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await translationService.translateRecipe(RECIPE_ID);

    const toolTransCalls = (supabase.from as jest.Mock).mock.calls.filter(
      ([t]: [string]) => t === "recipe_tool_translations"
    );
    expect(toolTransCalls).toHaveLength(0);
    spy.mockRestore();
  });
});

// ─── GET /recipes/:id?lang= ───────────────────────────────────────────────────

describe("GET /recipes/:id?lang=", () => {
  beforeEach(() => jest.clearAllMocks());

  const mockRecipeData = {
    id: "recipe-1",
    title: "Classic Adana Kebap",
    story: "A traditional recipe.",
    video_url: null,
    serving_size: 4,
    type: "community",
    is_published: true,
    average_rating: 4.5,
    rating_count: 10,
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
    creator: { id: "profile-1", username: "cook1" },
    dish_variety: null,
    recipe_ingredients: [
      {
        id: "ri-1",
        quantity: 2,
        unit: "cup",
        ingredient: { id: 1, name: "Flour", ingredient_allergens: [] },
      },
    ],
    recipe_steps: [{ id: "step-1", step_order: 1, description: "Mix ingredients." }],
    recipe_tools: [],
    recipe_media: [],
    recipe_dietary_tags: [],
  };

  /** Sets up supabase.from with per-table responses. Unknown tables resolve to null. */
  const setupMock = (tableMap: Record<string, { data: any; error: any }>) => {
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      const resolved = tableMap[table] ?? { data: null, error: null };
      return chain(resolved);
    });
  };

  it("returns original title and story when no lang param is provided", async () => {
    setupMock({ recipes: { data: mockRecipeData, error: null } });
    const res = await request(app).get("/recipes/recipe-1");
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("Classic Adana Kebap");
    expect(res.body.data.story).toBe("A traditional recipe.");
  });

  it("overrides title and story with translation when ?lang=tr and translation exists", async () => {
    setupMock({
      recipes: { data: mockRecipeData, error: null },
      recipe_translations: {
        data: { title: "Klasik Adana Kebabı", story: "Geleneksel bir tarif." },
        error: null,
      },
      recipe_step_translations: { data: [], error: null },
      recipe_ingredient_translations: { data: [], error: null },
    });

    const res = await request(app).get("/recipes/recipe-1?lang=tr");
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("Klasik Adana Kebabı");
    expect(res.body.data.story).toBe("Geleneksel bir tarif.");
  });

  it("returns original title and story when ?lang= is provided but no translation exists", async () => {
    setupMock({
      recipes: { data: mockRecipeData, error: null },
      recipe_translations: { data: null, error: null }, // no translation row
      recipe_step_translations: { data: [], error: null },
      recipe_ingredient_translations: { data: [], error: null },
    });

    const res = await request(app).get("/recipes/recipe-1?lang=tr");
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("Classic Adana Kebap");
    expect(res.body.data.story).toBe("A traditional recipe.");
  });

  it("overrides step descriptions with translated versions when they exist", async () => {
    setupMock({
      recipes: { data: mockRecipeData, error: null },
      recipe_translations: { data: null, error: null },
      recipe_step_translations: {
        data: [{ step_id: "step-1", description: "Malzemeleri karıştırın." }],
        error: null,
      },
      recipe_ingredient_translations: { data: [], error: null },
    });

    const res = await request(app).get("/recipes/recipe-1?lang=tr");
    expect(res.status).toBe(200);
    expect(res.body.data.steps[0].description).toBe("Malzemeleri karıştırın.");
  });

  it("falls back to original step description when no step translation exists", async () => {
    setupMock({
      recipes: { data: mockRecipeData, error: null },
      recipe_translations: { data: null, error: null },
      recipe_step_translations: { data: [], error: null },
      recipe_ingredient_translations: { data: [], error: null },
    });

    const res = await request(app).get("/recipes/recipe-1?lang=tr");
    expect(res.status).toBe(200);
    expect(res.body.data.steps[0].description).toBe("Mix ingredients.");
  });

  it("overrides ingredient unit with translated unit when it exists", async () => {
    setupMock({
      recipes: { data: mockRecipeData, error: null },
      recipe_translations: { data: null, error: null },
      recipe_step_translations: { data: [], error: null },
      recipe_ingredient_translations: {
        data: [{ recipe_ingredient_id: "ri-1", unit: "bardak" }],
        error: null,
      },
    });

    const res = await request(app).get("/recipes/recipe-1?lang=tr");
    expect(res.status).toBe(200);
    expect(res.body.data.ingredients[0].unit).toBe("bardak");
  });

  it("falls back to original ingredient unit when no unit translation exists", async () => {
    setupMock({
      recipes: { data: mockRecipeData, error: null },
      recipe_translations: { data: null, error: null },
      recipe_step_translations: { data: [], error: null },
      recipe_ingredient_translations: { data: [], error: null },
    });

    const res = await request(app).get("/recipes/recipe-1?lang=tr");
    expect(res.status).toBe(200);
    expect(res.body.data.ingredients[0].unit).toBe("cup");
  });

  // ─── dishVarietyName / genreName / ingredientName lang resolution ─────────────

  const mockRecipeWithNames = {
    ...mockRecipeData,
    dish_variety: {
      id: 2,
      name: "Adana Kebap",
      name_en: "Adana Kebap",
      name_tr: "Adana Kebabı",
      dish_genre: { id: 1, name: "Kebap", name_en: "Kebab", name_tr: "Kebap" },
    },
    recipe_ingredients: [
      {
        id: "ri-1",
        quantity: 2,
        unit: "cup",
        ingredient: { id: 1, name: "Flour", name_en: "Flour", name_tr: "Un", ingredient_allergens: [] },
      },
    ],
    recipe_tools: [{ id: "tool-1", name: "Oven" }],
  };

  it("dishVarietyName returns name_en when ?lang=en", async () => {
    setupMock({
      recipes: { data: mockRecipeWithNames, error: null },
      recipe_translations: { data: null, error: null },
      recipe_step_translations: { data: [], error: null },
      recipe_ingredient_translations: { data: [], error: null },
      recipe_tool_translations: { data: [], error: null },
    });
    const res = await request(app).get("/recipes/recipe-1?lang=en");
    expect(res.status).toBe(200);
    expect(res.body.data.dishVarietyName).toBe("Adana Kebap");
    expect(res.body.data.genreName).toBe("Kebab");
  });

  it("dishVarietyName returns name_tr when ?lang=tr", async () => {
    setupMock({
      recipes: { data: mockRecipeWithNames, error: null },
      recipe_translations: { data: null, error: null },
      recipe_step_translations: { data: [], error: null },
      recipe_ingredient_translations: { data: [], error: null },
      recipe_tool_translations: { data: [], error: null },
    });
    const res = await request(app).get("/recipes/recipe-1?lang=tr");
    expect(res.status).toBe(200);
    expect(res.body.data.dishVarietyName).toBe("Adana Kebabı");
    expect(res.body.data.genreName).toBe("Kebap");
  });

  it("dishVarietyName falls back to name_en when name_tr is null and ?lang=tr", async () => {
    setupMock({
      recipes: {
        data: {
          ...mockRecipeWithNames,
          dish_variety: {
            id: 2, name: "Urfa Kebap", name_en: "Urfa Kebap", name_tr: null,
            dish_genre: { id: 1, name: "Kebap", name_en: "Kebab", name_tr: null },
          },
        },
        error: null,
      },
      recipe_translations: { data: null, error: null },
      recipe_step_translations: { data: [], error: null },
      recipe_ingredient_translations: { data: [], error: null },
      recipe_tool_translations: { data: [], error: null },
    });
    const res = await request(app).get("/recipes/recipe-1?lang=tr");
    expect(res.status).toBe(200);
    expect(res.body.data.dishVarietyName).toBe("Urfa Kebap");
  });

  it("ingredientName returns lang-appropriate value when ?lang=tr", async () => {
    setupMock({
      recipes: { data: mockRecipeWithNames, error: null },
      recipe_translations: { data: null, error: null },
      recipe_step_translations: { data: [], error: null },
      recipe_ingredient_translations: { data: [], error: null },
      recipe_tool_translations: { data: [], error: null },
    });
    const res = await request(app).get("/recipes/recipe-1?lang=tr");
    expect(res.status).toBe(200);
    expect(res.body.data.ingredients[0].ingredientName).toBe("Un");
  });

  it("tools[].name returns translated name when ?lang=tr and translation exists", async () => {
    setupMock({
      recipes: { data: mockRecipeWithNames, error: null },
      recipe_translations: { data: null, error: null },
      recipe_step_translations: { data: [], error: null },
      recipe_ingredient_translations: { data: [], error: null },
      recipe_tool_translations: {
        data: [{ recipe_tool_id: "tool-1", name: "Fırın" }],
        error: null,
      },
    });
    const res = await request(app).get("/recipes/recipe-1?lang=tr");
    expect(res.status).toBe(200);
    expect(res.body.data.tools[0].name).toBe("Fırın");
  });

  it("tools[].name falls back to original when no tool translation exists", async () => {
    setupMock({
      recipes: { data: mockRecipeWithNames, error: null },
      recipe_translations: { data: null, error: null },
      recipe_step_translations: { data: [], error: null },
      recipe_ingredient_translations: { data: [], error: null },
      recipe_tool_translations: { data: [], error: null },
    });
    const res = await request(app).get("/recipes/recipe-1?lang=tr");
    expect(res.status).toBe(200);
    expect(res.body.data.tools[0].name).toBe("Oven");
  });
});

// ─── POST /recipes/:id/publish — additional edge cases ────────────────────────

describe("POST /recipes/:id/publish — additional edge cases", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when request has no Authorization header", async () => {
    const res = await request(app).post("/recipes/recipe-1/publish");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 409 when recipe is already published", async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    });
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "profiles")
        return chain({ data: { id: "profile-123", username: "tester", role: "cook" }, error: null });
      if (table === "recipes")
        return chain({
          data: { creator_id: "profile-123", is_published: true },
          error: null,
        });
      return chain({ data: null, error: null });
    });

    const res = await request(app)
      .post("/recipes/recipe-1/publish")
      .set("Authorization", "Bearer valid_token");

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");
  });

  it("triggers translateRecipe fire-and-forget after a successful publish", async () => {
    const translateSpy = jest
      .spyOn(translationService, "translateRecipe")
      .mockResolvedValue(undefined);

    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    });

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "profiles")
        return chain({ data: { id: "profile-123", username: "tester", role: "cook" }, error: null });
      if (table === "recipes")
        return chain({
          data: {
            creator_id: "profile-123",
            is_published: false,
            dish_variety_id: 1,
            serving_size: 4,
            recipe_ingredients: [{ id: 1 }],
            recipe_steps: [{ id: 1 }],
          },
          error: null,
        });
      return chain({ data: null, error: null });
    });

    const res = await request(app)
      .post("/recipes/recipe-1/publish")
      .set("Authorization", "Bearer valid_token");

    expect(res.status).toBe(200);
    expect(res.body.data.isPublished).toBe(true);
    expect(translateSpy).toHaveBeenCalledWith("recipe-1");

    translateSpy.mockRestore();
  });
});

// ─── POST /recipes — translation trigger ─────────────────────────────────────

describe("POST /recipes — translation trigger", () => {
  beforeEach(() => jest.clearAllMocks());

  const setupAuth = (role: string, profileId = "profile-123") => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    });

    const mockSingle = jest.fn().mockResolvedValue({
      data: { id: "recipe-new", created_at: "2024-01-01" },
      error: null,
    });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "profiles")
        return chain({ data: { id: profileId, username: "tester", role }, error: null });
      if (table === "recipes") return { insert: mockInsert };
      return { insert: jest.fn().mockResolvedValue({ error: null }) };
    });
  };

  it("triggers translateRecipe fire-and-forget after POST /recipes succeeds", async () => {
    const translateSpy = jest
      .spyOn(translationService, "translateRecipe")
      .mockResolvedValue(undefined);

    setupAuth("cook");

    const res = await request(app)
      .post("/recipes")
      .set("Authorization", "Bearer valid_token")
      .send({
        title: "Test Recipe",
        type: "community",
        servingSize: 4,
        ingredients: [{ ingredientId: 1, quantity: 1, unit: "cup" }],
        steps: [{ stepOrder: 1, description: "Mix" }],
      });

    expect(res.status).toBe(201);
    expect(translateSpy).toHaveBeenCalledWith("recipe-new");

    translateSpy.mockRestore();
  });
});

// ─── PATCH /recipes/:id — translation trigger ─────────────────────────────────

describe("PATCH /recipes/:id — translation trigger", () => {
  beforeEach(() => jest.clearAllMocks());

  it("triggers translateRecipe fire-and-forget after PATCH /recipes/:id succeeds", async () => {
    const translateSpy = jest
      .spyOn(translationService, "translateRecipe")
      .mockResolvedValue(undefined);

    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    });

    const mockUpdateEq = jest.fn().mockResolvedValue({ error: null });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockUpdateEq });
    const mockDeleteEq = jest.fn().mockResolvedValue({ error: null });
    const mockDelete = jest.fn().mockReturnValue({ eq: mockDeleteEq });

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "profiles")
        return chain({ data: { id: "profile-123", username: "tester", role: "cook" }, error: null });
      if (table === "recipes")
        return {
          ...chain({ data: { creator_id: "profile-123", type: "community" }, error: null }),
          update: mockUpdate,
        };
      return { delete: mockDelete, insert: jest.fn().mockResolvedValue({ error: null }) };
    });

    const res = await request(app)
      .patch("/recipes/recipe-123")
      .set("Authorization", "Bearer valid_token")
      .send({ title: "Updated Title" });

    expect(res.status).toBe(200);
    expect(translateSpy).toHaveBeenCalledWith("recipe-123");

    translateSpy.mockRestore();
  });
});
