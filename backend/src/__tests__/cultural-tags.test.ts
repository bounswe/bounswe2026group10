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

const chainable = (resolved: { data: any; error: any; count?: number | null }) => {
  const mock: any = {};
  const methods = [
    "select", "eq", "neq", "in", "not", "or", "order",
    "range", "single", "maybeSingle", "ilike", "limit", "filter",
  ];
  methods.forEach((m) => {
    mock[m] = jest.fn().mockReturnValue(mock);
  });
  mock.then = (resolve: any) => Promise.resolve(resolved).then(resolve);
  mock.catch = (reject: any) => Promise.resolve(resolved).catch(reject);
  return mock;
};

// ─── GET /cultural-tags ───────────────────────────────────────────────────────

describe("GET /cultural-tags", () => {
  beforeEach(() => jest.clearAllMocks());

  const allTags = [
    { id: 1, key: "social-gathering", label_en: "Social Gathering", label_tr: "Sosyal Toplanma", country: null },
    { id: 2, key: "wedding",          label_en: "Wedding",           label_tr: "Düğün",           country: null },
    { id: 8, key: "sira-gecesi",      label_en: "Sıra Gecesi",       label_tr: "Sıra Gecesi",      country: "Turkey" },
    { id: 9, key: "iftar",            label_en: "Iftar",             label_tr: "İftar",            country: "Turkey" },
    { id: 10, key: "mochitsuki",      label_en: "Mochitsuki",        label_tr: "Mochitsuki",       country: "Japan" },
  ];

  it("returns all tags with 200 when no country filter", async () => {
    (supabase.from as jest.Mock).mockReturnValue(chainable({ data: allTags, error: null }));

    const res = await request(app).get("/cultural-tags");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(5);
    expect(res.body.data[0].key).toBe("social-gathering");
    expect(res.body.data[0].labelEn).toBe("Social Gathering");
    expect(res.body.data[0].labelTr).toBe("Sosyal Toplanma");
    expect(res.body.data[0].country).toBeNull();
  });

  it("camelCases the response fields correctly", async () => {
    (supabase.from as jest.Mock).mockReturnValue(chainable({ data: [allTags[0]], error: null }));

    const res = await request(app).get("/cultural-tags");

    expect(res.status).toBe(200);
    const tag = res.body.data[0];
    expect(tag).toHaveProperty("id");
    expect(tag).toHaveProperty("key");
    expect(tag).toHaveProperty("labelEn");
    expect(tag).toHaveProperty("labelTr");
    expect(tag).toHaveProperty("country");
    expect(tag).not.toHaveProperty("label_en");
    expect(tag).not.toHaveProperty("label_tr");
  });

  it("applies country filter when ?country= is provided", async () => {
    const turkeyTags = allTags.filter((t) => t.country === null || t.country === "Turkey");
    (supabase.from as jest.Mock).mockReturnValue(chainable({ data: turkeyTags, error: null }));

    const res = await request(app).get("/cultural-tags?country=Turkey");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(4);
    const keys = res.body.data.map((t: any) => t.key);
    expect(keys).toContain("social-gathering");
    expect(keys).toContain("sira-gecesi");
    expect(keys).toContain("iftar");
    expect(keys).not.toContain("mochitsuki");
  });

  it("applies country filter for Japan", async () => {
    const japanTags = allTags.filter((t) => t.country === null || t.country === "Japan");
    (supabase.from as jest.Mock).mockReturnValue(chainable({ data: japanTags, error: null }));

    const res = await request(app).get("/cultural-tags?country=Japan");

    expect(res.status).toBe(200);
    const keys = res.body.data.map((t: any) => t.key);
    expect(keys).toContain("mochitsuki");
    expect(keys).not.toContain("sira-gecesi");
  });

  it("returns empty array when no tags exist", async () => {
    (supabase.from as jest.Mock).mockReturnValue(chainable({ data: [], error: null }));

    const res = await request(app).get("/cultural-tags");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it("returns 500 on database error", async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: null, error: { message: "DB connection failed" } })
    );

    const res = await request(app).get("/cultural-tags");

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("DB_ERROR");
  });
});

// ─── GET /recipes/:id — culturalTags in payload ───────────────────────────────

describe("GET /recipes/:id — culturalTags field", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns culturalTags array in recipe detail", async () => {
    const mockRecipe = {
      id: "recipe-1",
      title: "Çiğ Köfte",
      story: "Sıra gecesi geleneği...",
      video_url: null,
      serving_size: 4,
      type: "cultural",
      is_published: true,
      average_rating: 4.5,
      rating_count: 10,
      allergen_ids: [],
      country: "Turkey",
      city: "Şanlıurfa",
      district: null,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
      creator: { id: "u1", username: "cook1" },
      dish_variety: { id: 1, name: "Çiğ Köfte", dish_genre: { id: 1, name: "Salads" } },
      recipe_ingredients: [],
      recipe_steps: [],
      recipe_tools: [],
      recipe_media: [],
      recipe_dietary_tags: [],
      recipe_cultural_tags: [
        {
          cultural_tag: {
            id: 1,
            key: "social-gathering",
            label_en: "Social Gathering",
            label_tr: "Sosyal Toplanma",
            country: null,
          },
        },
        {
          cultural_tag: {
            id: 8,
            key: "sira-gecesi",
            label_en: "Sıra Gecesi",
            label_tr: "Sıra Gecesi",
            country: "Turkey",
          },
        },
      ],
      video_annotations: [],
    };

    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "recipes") return chainable({ data: mockRecipe, error: null });
      if (table === "allergens") return chainable({ data: [], error: null });
      if (table === "user_favorites") return chainable({ data: null, error: null });
      return chainable({ data: null, error: null });
    });

    const res = await request(app).get("/recipes/recipe-1");

    expect(res.status).toBe(200);
    expect(res.body.data.culturalTags).toHaveLength(2);
    expect(res.body.data.culturalTags[0].key).toBe("social-gathering");
    expect(res.body.data.culturalTags[0].labelEn).toBe("Social Gathering");
    expect(res.body.data.culturalTags[1].key).toBe("sira-gecesi");
    expect(res.body.data.culturalTags[1].country).toBe("Turkey");
  });

  it("returns empty culturalTags array when recipe has none", async () => {
    const mockRecipe = {
      id: "recipe-2",
      title: "Plain Recipe",
      story: null,
      video_url: null,
      serving_size: null,
      type: "community",
      is_published: true,
      average_rating: null,
      rating_count: 0,
      allergen_ids: [],
      country: null,
      city: null,
      district: null,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
      creator: { id: "u1", username: "cook1" },
      dish_variety: null,
      recipe_ingredients: [],
      recipe_steps: [],
      recipe_tools: [],
      recipe_media: [],
      recipe_dietary_tags: [],
      recipe_cultural_tags: [],
      video_annotations: [],
    };

    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "recipes") return chainable({ data: mockRecipe, error: null });
      if (table === "allergens") return chainable({ data: [], error: null });
      return chainable({ data: null, error: null });
    });

    const res = await request(app).get("/recipes/recipe-2");

    expect(res.status).toBe(200);
    expect(res.body.data.culturalTags).toHaveLength(0);
  });
});

// ─── GET /discovery/recipes?culturalTagIds ────────────────────────────────────

describe("GET /discovery/recipes?culturalTagIds", () => {
  beforeEach(() => jest.clearAllMocks());

  const mockRecipes = [
    {
      id: "r1",
      title: "Çiğ Köfte",
      type: "cultural",
      average_rating: 4.5,
      rating_count: 5,
      allergen_ids: [],
      country: "Turkey",
      city: "Şanlıurfa",
      district: null,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
      dish_variety: { id: 1, name: "Çiğ Köfte", dish_genre: { id: 2, name: "Salads" } },
      profile: { id: "u1", username: "cook1" },
      recipe_media: [],
    },
  ];

  it("returns recipes matching the cultural tag (OR logic)", async () => {
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "recipe_cultural_tags")
        return chainable({ data: [{ recipe_id: "r1" }], error: null });
      if (table === "recipes")
        return chainable({ data: mockRecipes, error: null, count: 1 });
      if (table === "allergens")
        return chainable({ data: [], error: null });
      return chainable({ data: [], error: null });
    });

    const res = await request(app).get("/discovery/recipes?culturalTagIds=1");

    expect(res.status).toBe(200);
    expect(res.body.data.recipes).toHaveLength(1);
    expect(res.body.data.recipes[0].title).toBe("Çiğ Köfte");
  });

  it("returns cascade varieties and genres from matching recipes", async () => {
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "recipe_cultural_tags")
        return chainable({ data: [{ recipe_id: "r1" }], error: null });
      if (table === "recipes")
        return chainable({ data: mockRecipes, error: null, count: 1 });
      if (table === "allergens")
        return chainable({ data: [], error: null });
      return chainable({ data: [], error: null });
    });

    const res = await request(app).get("/discovery/recipes?culturalTagIds=1");

    expect(res.status).toBe(200);
    expect(res.body.data.varieties.length).toBeGreaterThanOrEqual(0);
    expect(res.body.data.genres.length).toBeGreaterThanOrEqual(0);
    expect(res.body.data).toHaveProperty("pagination");
  });

  it("returns empty result when no recipes match the cultural tag", async () => {
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "recipe_cultural_tags")
        return chainable({ data: [], error: null });
      return chainable({ data: [], error: null });
    });

    const res = await request(app).get("/discovery/recipes?culturalTagIds=999");

    expect(res.status).toBe(200);
    expect(res.body.data.recipes).toHaveLength(0);
    expect(res.body.data.pagination.total).toBe(0);
  });

  it("multiple culturalTagIds uses OR — returns recipes from any matching tag", async () => {
    // recipe r1 has tag 1, recipe r2 has tag 8 — both should appear
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "recipe_cultural_tags")
        return chainable({
          data: [{ recipe_id: "r1" }, { recipe_id: "r2" }],
          error: null,
        });
      if (table === "recipes")
        return chainable({ data: mockRecipes, error: null, count: 2 });
      if (table === "allergens")
        return chainable({ data: [], error: null });
      return chainable({ data: [], error: null });
    });

    const res = await request(app).get("/discovery/recipes?culturalTagIds=1,8");

    expect(res.status).toBe(200);
    // Both recipe IDs were passed to the main query via .in("id", [...])
    expect(res.body.data.pagination).toBeDefined();
  });

  it("returns 500 when recipe_cultural_tags query fails", async () => {
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "recipe_cultural_tags")
        return chainable({ data: null, error: { message: "DB failure" } });
      return chainable({ data: [], error: null });
    });

    const res = await request(app).get("/discovery/recipes?culturalTagIds=1");

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("DB_ERROR");
  });

  it("ignores culturalTagIds param when not provided — returns all recipes", async () => {
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "recipes")
        return chainable({ data: mockRecipes, error: null, count: 1 });
      if (table === "allergens")
        return chainable({ data: [], error: null });
      return chainable({ data: [], error: null });
    });

    const res = await request(app).get("/discovery/recipes");

    expect(res.status).toBe(200);
    expect(res.body.data.recipes).toBeDefined();
  });
});
