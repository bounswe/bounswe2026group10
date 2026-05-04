import request from "supertest";
import app from "../index.js";
import { supabase } from "../config/supabase.js";

jest.mock("../config/supabase.js", () => {
  const mockFrom = jest.fn();
  return {
    supabase: { from: mockFrom },
    createUserClient: jest.fn(() => ({ from: mockFrom })),
  };
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const chainable = (resolved: { data: any; error: any }) => {
  const mock: any = {};
  const methods = ["select", "eq", "ilike", "or", "order"];
  methods.forEach((m) => {
    mock[m] = jest.fn().mockReturnValue(mock);
  });
  mock.single = jest.fn().mockResolvedValue(resolved);
  mock.then = (resolve: any) => Promise.resolve(resolved).then(resolve);
  mock.catch = (reject: any) => Promise.resolve(resolved).catch(reject);
  return mock;
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockVarieties = [
  {
    id: 1, genre_id: 1,
    name: "Adana Kebap", name_en: "Adana Kebab", name_tr: "Adana Kebap",
    description: "Spicy grilled meat", description_en: "Spicy grilled meat dish", description_tr: "Acılı ızgara et yemeği",
    dish_genre: { id: 1, name: "Kebap", name_en: "Kebab", name_tr: "Kebap" },
  },
  {
    id: 2, genre_id: 2,
    name: "Mercimek", name_en: "Lentil Soup", name_tr: null,
    description: "Lentil soup", description_en: "Red lentil soup", description_tr: null,
    dish_genre: { id: 2, name: "Çorba", name_en: "Soup", name_tr: "Çorba" },
  },
];

const mockRecipes = [
  {
    id: "r1", title: "Classic Adana", type: "cultural",
    average_rating: 4.8, rating_count: 20,
    country: "Turkey", city: "Adana", district: null,
    created_at: "2024-01-01", updated_at: "2024-01-01",
  },
  {
    id: "r2", title: "My Adana", type: "community",
    average_rating: 4.0, rating_count: 5,
    country: null, city: null, district: null,
    created_at: "2024-02-01", updated_at: "2024-02-01",
  },
];

// ─── GET /dish-varieties ──────────────────────────────────────────────────────

describe("GET /dish-varieties", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns all varieties with 200", async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: mockVarieties, error: null })
    );

    const res = await request(app).get("/dish-varieties");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].name).toBe("Adana Kebap");
  });

  it("returns name_en, name_tr, description_en, description_tr in default response", async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: mockVarieties, error: null })
    );

    const res = await request(app).get("/dish-varieties");

    expect(res.status).toBe(200);
    const v = res.body.data[0];
    expect(v.name_en).toBe("Adana Kebab");
    expect(v.name_tr).toBe("Adana Kebap");
    expect(v.description_en).toBe("Spicy grilled meat dish");
    expect(v.description_tr).toBe("Acılı ızgara et yemeği");
  });

  it("filters by genreId", async () => {
    const filtered = [mockVarieties[0]];
    const chain = chainable({ data: filtered, error: null });
    (supabase.from as jest.Mock).mockReturnValue(chain);

    const res = await request(app).get("/dish-varieties?genreId=1");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(chain.eq).toHaveBeenCalledWith("genre_id", 1);
  });

  it("returns 400 for non-integer genreId", async () => {
    const res = await request(app).get("/dish-varieties?genreId=abc");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("applies search filter when search param provided", async () => {
    const chain = chainable({ data: [mockVarieties[0]], error: null });
    (supabase.from as jest.Mock).mockReturnValue(chain);

    const res = await request(app).get("/dish-varieties?search=adana");

    expect(res.status).toBe(200);
    // Search now expands across name/name_en/name_tr with Turkish-aware
    // variants ORed together (#402).
    expect(chain.or).toHaveBeenCalled();
    const orArg = (chain.or as jest.Mock).mock.calls[0][0] as string;
    expect(orArg).toContain("name.ilike.%adana%");
    expect(orArg).toContain("name_en.ilike.%adana%");
    expect(orArg).toContain("name_tr.ilike.%adana%");
  });

  it("returns 500 on database error", async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: null, error: { message: "DB error" } })
    );

    const res = await request(app).get("/dish-varieties");

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("DB_ERROR");
  });
});

// ─── GET /dish-varieties — language fields (#412) ────────────────────────────

describe("GET /dish-varieties — language fields (#412)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("?lang=en returns resolved EN names and descriptions", async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: mockVarieties, error: null })
    );

    const res = await request(app).get("/dish-varieties?lang=en");

    expect(res.status).toBe(200);
    const v = res.body.data[0];
    expect(v.name).toBe("Adana Kebab");
    expect(v.description).toBe("Spicy grilled meat dish");
    expect(v.dish_genre.name).toBe("Kebab");
    expect(v.name_en).toBeUndefined();
    expect(v.name_tr).toBeUndefined();
  });

  it("?lang=tr returns resolved TR names", async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: mockVarieties, error: null })
    );

    const res = await request(app).get("/dish-varieties?lang=tr");

    expect(res.status).toBe(200);
    expect(res.body.data[0].name).toBe("Adana Kebap");
    expect(res.body.data[0].description).toBe("Acılı ızgara et yemeği");
    expect(res.body.data[0].dish_genre.name).toBe("Kebap");
  });

  it("?lang=tr falls back to EN when TR fields are null", async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: mockVarieties, error: null })
    );

    const res = await request(app).get("/dish-varieties?lang=tr");

    expect(res.status).toBe(200);
    // Second variety has null name_tr and description_tr
    expect(res.body.data[1].name).toBe("Lentil Soup");
    expect(res.body.data[1].description).toBe("Red lentil soup");
  });

  it("?lang=de returns 400 VALIDATION_ERROR", async () => {
    const res = await request(app).get("/dish-varieties?lang=de");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

// ─── GET /dish-varieties/:id ──────────────────────────────────────────────────

describe("GET /dish-varieties/:id", () => {
  beforeEach(() => jest.clearAllMocks());

  const setupVarietyAndRecipes = (varietyData: any, varietyError: any = null) => {
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "dish_varieties") return chainable({ data: varietyData, error: varietyError });
      if (table === "recipes") return chainable({ data: mockRecipes, error: null });
      return chainable({ data: null, error: null });
    });
  };

  it("returns variety with recipes and lang fields", async () => {
    setupVarietyAndRecipes(mockVarieties[0]);

    const res = await request(app).get("/dish-varieties/1");

    expect(res.status).toBe(200);
    expect(res.body.data.name_en).toBe("Adana Kebab");
    expect(res.body.data.name_tr).toBe("Adana Kebap");
    expect(res.body.data.recipes).toHaveLength(2);
  });

  it("?lang=en returns resolved EN names", async () => {
    setupVarietyAndRecipes(mockVarieties[0]);

    const res = await request(app).get("/dish-varieties/1?lang=en");

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Adana Kebab");
    expect(res.body.data.description).toBe("Spicy grilled meat dish");
    expect(res.body.data.dish_genre.name).toBe("Kebab");
    expect(res.body.data.name_en).toBeUndefined();
  });

  it("?lang=tr falls back to EN when TR fields are null", async () => {
    setupVarietyAndRecipes(mockVarieties[1]);

    const res = await request(app).get("/dish-varieties/2?lang=tr");

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Lentil Soup");
    expect(res.body.data.description).toBe("Red lentil soup");
  });

  it("?lang=de returns 400 VALIDATION_ERROR", async () => {
    const res = await request(app).get("/dish-varieties/1?lang=de");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for non-integer id", async () => {
    const res = await request(app).get("/dish-varieties/abc");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 when variety not found", async () => {
    setupVarietyAndRecipes(null, { code: "PGRST116", message: "Not found" });

    const res = await request(app).get("/dish-varieties/999");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("returns 500 on database error", async () => {
    setupVarietyAndRecipes(null, { code: "500", message: "DB error" });

    const res = await request(app).get("/dish-varieties/1");

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("DB_ERROR");
  });
});

// ─── GET /dish-varieties/:id/recipes ─────────────────────────────────────────

describe("GET /dish-varieties/:id/recipes", () => {
  beforeEach(() => jest.clearAllMocks());

  const setupRecipesRoute = (varietyData: any, varietyError: any = null) => {
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "dish_varieties") return chainable({ data: varietyData, error: varietyError });
      if (table === "recipes") return chainable({ data: mockRecipes, error: null });
      return chainable({ data: null, error: null });
    });
  };

  it("returns expertRecipe and communityRecipes arrays", async () => {
    setupRecipesRoute({ id: 1 });

    const res = await request(app).get("/dish-varieties/1/recipes");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.expertRecipe).toBeDefined();
    expect(res.body.data.communityRecipes).toBeDefined();
    expect(res.body.data.expertRecipe.type).toBe("cultural");
    expect(res.body.data.communityRecipes).toHaveLength(1);
    expect(res.body.data.communityRecipes[0].type).toBe("community");
  });

  it("expertRecipe is null when no cultural recipe exists", async () => {
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "dish_varieties") return chainable({ data: { id: 1 }, error: null });
      if (table === "recipes") return chainable({ data: [mockRecipes[1]], error: null });
      return chainable({ data: null, error: null });
    });

    const res = await request(app).get("/dish-varieties/1/recipes");

    expect(res.status).toBe(200);
    expect(res.body.data.expertRecipe).toBeNull();
    expect(res.body.data.communityRecipes).toHaveLength(1);
  });

  it("returns 400 for non-integer id", async () => {
    const res = await request(app).get("/dish-varieties/abc/recipes");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 when variety not found", async () => {
    setupRecipesRoute(null, { code: "PGRST116", message: "Not found" });

    const res = await request(app).get("/dish-varieties/999/recipes");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});
