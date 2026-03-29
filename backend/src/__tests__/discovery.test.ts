import request from "supertest";
import app from "../index.js";
import { supabase } from "../config/supabase.js";

// ─── Mock Supabase ────────────────────────────────────────────────────────────

jest.mock("../config/supabase.js", () => {
  const mockFrom = jest.fn();
  return {
    supabase: { from: mockFrom },
    createUserClient: jest.fn(() => ({ from: mockFrom })),
  };
});

// ─── Helper: chainable Supabase mock ─────────────────────────────────────────
// Supabase query builder is a thenable — every chained method returns `this`,
// and awaiting the chain resolves to { data, error, count }.

const chainable = (resolved: { data: any; error: any; count?: number | null }) => {
  const mock: any = {};
  const methods = ["select", "eq", "neq", "in", "not", "order", "range", "filter", "single", "limit", "ilike"];
  methods.forEach((m) => {
    mock[m] = jest.fn().mockReturnValue(mock);
  });
  mock.then = (resolve: any) => Promise.resolve(resolved).then(resolve);
  mock.catch = (reject: any) => Promise.resolve(resolved).catch(reject);
  return mock;
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GET /dish-genres", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns genres with nested varieties", async () => {
    const mockGenres = [{ id: 1, name: "Kebap", description: "Grilled meats", image_url: null }];
    const mockVarieties = [
      { id: 1, name: "Adana Kebap", genre_id: 1 },
      { id: 2, name: "Urfa Kebap", genre_id: 1 },
    ];

    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "dish_genres") return chainable({ data: mockGenres, error: null });
      if (table === "dish_varieties") return chainable({ data: mockVarieties, error: null });
    });

    const res = await request(app).get("/dish-genres");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe("Kebap");
    expect(res.body.data[0].varieties).toHaveLength(2);
  });

  it("returns empty varieties array when none exist", async () => {
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "dish_genres") return chainable({ data: [{ id: 1, name: "Soup", description: "", image_url: null }], error: null });
      if (table === "dish_varieties") return chainable({ data: [], error: null });
    });

    const res = await request(app).get("/dish-genres");

    expect(res.status).toBe(200);
    expect(res.body.data[0].varieties).toHaveLength(0);
  });

  it("returns 500 on database error", async () => {
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "dish_genres")
        return chainable({ data: null, error: { message: "DB connection failed" } });
    });

    const res = await request(app).get("/dish-genres");

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("DB_ERROR");
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("GET /dish-varieties", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns all varieties without filter", async () => {
    const mockVarieties = [
      { id: 1, name: "Adana Kebap", description: "", genre_id: 1, dish_genre: { id: 1, name: "Kebap" } },
      { id: 2, name: "Mercimek Çorbası", description: "", genre_id: 2, dish_genre: { id: 2, name: "Soup" } },
    ];

    (supabase.from as jest.Mock).mockReturnValue(chainable({ data: mockVarieties, error: null }));

    const res = await request(app).get("/dish-varieties");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
  });

  it("filters varieties by genreId", async () => {
    const mockVarieties = [
      { id: 1, name: "Adana Kebap", description: "", genre_id: 1, dish_genre: { id: 1, name: "Kebap" } },
    ];

    (supabase.from as jest.Mock).mockReturnValue(chainable({ data: mockVarieties, error: null }));

    const res = await request(app).get("/dish-varieties?genreId=1");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].genre_id).toBe(1);
  });

  it("returns 400 for non-integer genreId", async () => {
    const res = await request(app).get("/dish-varieties?genreId=abc");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for zero genreId", async () => {
    const res = await request(app).get("/dish-varieties?genreId=0");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns matching varieties for a valid search query", async () => {
    const mockVarieties = [
      { id: 1, name: "Adana Kebap", description: "", genre_id: 1, dish_genre: { id: 1, name: "Kebap" } },
    ];
    (supabase.from as jest.Mock).mockReturnValue(chainable({ data: mockVarieties, error: null }));

    const res = await request(app).get("/dish-varieties?search=adana");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe("Adana Kebap");
  });

  it("returns empty array when no variety matches the search query", async () => {
    (supabase.from as jest.Mock).mockReturnValue(chainable({ data: [], error: null }));

    const res = await request(app).get("/dish-varieties?search=zzznomatch");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it("returns all varieties when search query is a single character", async () => {
    const mockVarieties = [
      { id: 1, name: "Adana Kebap", description: "", genre_id: 1, dish_genre: { id: 1, name: "Kebap" } },
    ];
    (supabase.from as jest.Mock).mockReturnValue(chainable({ data: mockVarieties, error: null }));

    const res = await request(app).get("/dish-varieties?search=a");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("returns all varieties when search query is empty string", async () => {
    const mockVarieties = [
      { id: 1, name: "Adana Kebap", description: "", genre_id: 1, dish_genre: { id: 1, name: "Kebap" } },
      { id: 2, name: "Mercimek Çorbası", description: "", genre_id: 2, dish_genre: { id: 2, name: "Soup" } },
    ];
    (supabase.from as jest.Mock).mockReturnValue(chainable({ data: mockVarieties, error: null }));

    const res = await request(app).get("/dish-varieties?search=");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it("supports combining search and genreId filters", async () => {
    const mockVarieties = [
      { id: 1, name: "Adana Kebap", description: "", genre_id: 1, dish_genre: { id: 1, name: "Kebap" } },
    ];
    (supabase.from as jest.Mock).mockReturnValue(chainable({ data: mockVarieties, error: null }));

    const res = await request(app).get("/dish-varieties?genreId=1&search=adana");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("GET /dish-varieties/:id", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns a variety with its published recipes", async () => {
    const mockVariety = {
      id: 1, name: "Adana Kebap", description: "", genre_id: 1,
      dish_genre: { id: 1, name: "Kebap" },
    };
    const mockRecipes = [
      { id: 10, title: "Classic Adana", type: "community", average_rating: 4.5, rating_count: 12, region: "Turkey", created_at: "2024-01-01", updated_at: "2024-01-01" },
    ];

    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "dish_varieties") return chainable({ data: mockVariety, error: null });
      if (table === "recipes") return chainable({ data: mockRecipes, error: null });
    });

    const res = await request(app).get("/dish-varieties/1");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Adana Kebap");
    expect(res.body.data.recipes).toHaveLength(1);
  });

  it("returns 404 when variety does not exist", async () => {
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "dish_varieties")
        return chainable({ data: null, error: { code: "PGRST116", message: "Not found" } });
    });

    const res = await request(app).get("/dish-varieties/999");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("returns 400 for non-integer id", async () => {
    const res = await request(app).get("/dish-varieties/abc");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("GET /discovery/recipes", () => {
  beforeEach(() => jest.clearAllMocks());

  const mockRecipes = [
    {
      id: 1, title: "Adana Kebap", type: "community", region: "Turkey",
      average_rating: 4.8, rating_count: 20, created_at: "2024-01-01", updated_at: "2024-01-01",
      dish_variety: { id: 1, name: "Adana Kebap", dish_genre: { id: 1, name: "Kebap" } },
      profile: { id: "p1", username: "cook1" },
    },
  ];

  it("returns published recipes with no filters", async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: mockRecipes, error: null, count: 1 })
    );

    const res = await request(app).get("/discovery/recipes");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.recipes).toHaveLength(1);
    expect(res.body.data.pagination).toMatchObject({ page: 1, limit: 20, total: 1 });
  });

  it("filters by region", async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: mockRecipes, error: null, count: 1 })
    );

    const res = await request(app).get("/discovery/recipes?region=Turkey");

    expect(res.status).toBe(200);
    expect(res.body.data.recipes[0].region).toBe("Turkey");
  });

  it("excludes recipes with specified allergens", async () => {
    const mockAllergenIngredients = [{ ingredient_id: 5 }];
    const mockRecipeIngredients = [{ recipe_id: 99 }];

    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "ingredient_allergens")
        return chainable({ data: mockAllergenIngredients, error: null });
      if (table === "recipe_ingredients")
        return chainable({ data: mockRecipeIngredients, error: null });
      if (table === "recipes")
        return chainable({ data: [], error: null, count: 0 });
    });

    const res = await request(app).get("/discovery/recipes?excludeAllergens=1");

    expect(res.status).toBe(200);
    expect(res.body.data.recipes).toHaveLength(0);
  });

  it("returns empty when genreId has no varieties", async () => {
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "dish_varieties") return chainable({ data: [], error: null });
    });

    const res = await request(app).get("/discovery/recipes?genreId=999");

    expect(res.status).toBe(200);
    expect(res.body.data.recipes).toHaveLength(0);
    expect(res.body.data.pagination.total).toBe(0);
  });

  it("filters by varietyId", async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: mockRecipes, error: null, count: 1 })
    );

    const res = await request(app).get("/discovery/recipes?varietyId=1");

    expect(res.status).toBe(200);
    expect(res.body.data.recipes).toHaveLength(1);
  });

  it("returns 400 for invalid limit", async () => {
    const res = await request(app).get("/discovery/recipes?limit=abc");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for limit exceeding 100", async () => {
    const res = await request(app).get("/discovery/recipes?limit=200");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for page=0", async () => {
    const res = await request(app).get("/discovery/recipes?page=0");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("respects pagination params", async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: mockRecipes, error: null, count: 50 })
    );

    const res = await request(app).get("/discovery/recipes?page=2&limit=10");

    expect(res.status).toBe(200);
    expect(res.body.data.pagination).toMatchObject({ page: 2, limit: 10, total: 50 });
  });

  it("returns 500 on database error", async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: null, error: { message: "DB timeout" }, count: null })
    );

    const res = await request(app).get("/discovery/recipes");

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("DB_ERROR");
  });
});
