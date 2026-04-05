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

describe("GET /dish-varieties/:id/recipes", () => {
  beforeEach(() => jest.clearAllMocks());

  const mockCommunityRecipes = [
    { id: 10, title: "Community A", type: "community", average_rating: 4.8, rating_count: 20, created_at: "2024-01-01", updated_at: "2024-01-01", creator: { id: "p1", username: "cook1" } },
    { id: 11, title: "Community B", type: "community", average_rating: 3.5, rating_count: 8, created_at: "2024-01-02", updated_at: "2024-01-02", creator: { id: "p2", username: "cook2" } },
  ];
  const mockExpertRecipe = { id: 20, title: "Expert Recipe", type: "cultural", average_rating: 4.9, rating_count: 50, created_at: "2024-01-03", updated_at: "2024-01-03", creator: { id: "p3", username: "expert1" } };

  it("returns expertRecipe and communityRecipes separated", async () => {
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "dish_varieties") return chainable({ data: { id: 1 }, error: null });
      if (table === "recipes") return chainable({ data: [mockExpertRecipe, ...mockCommunityRecipes], error: null });
    });

    const res = await request(app).get("/dish-varieties/1/recipes");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.expertRecipe).not.toBeNull();
    expect(res.body.data.expertRecipe.type).toBe("cultural");
    expect(res.body.data.communityRecipes).toHaveLength(2);
    expect(res.body.data.communityRecipes.every((r: any) => r.type === "community")).toBe(true);
  });

  it("returns community recipes sorted by rating descending", async () => {
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "dish_varieties") return chainable({ data: { id: 1 }, error: null });
      if (table === "recipes") return chainable({ data: mockCommunityRecipes, error: null });
    });

    const res = await request(app).get("/dish-varieties/1/recipes");

    expect(res.status).toBe(200);
    const ratings = res.body.data.communityRecipes.map((r: any) => r.average_rating);
    expect(ratings[0]).toBeGreaterThanOrEqual(ratings[1]);
  });

  it("returns null expertRecipe when no cultural recipe exists", async () => {
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "dish_varieties") return chainable({ data: { id: 1 }, error: null });
      if (table === "recipes") return chainable({ data: mockCommunityRecipes, error: null });
    });

    const res = await request(app).get("/dish-varieties/1/recipes");

    expect(res.status).toBe(200);
    expect(res.body.data.expertRecipe).toBeNull();
    expect(res.body.data.communityRecipes).toHaveLength(2);
  });

  it("returns empty communityRecipes when no community recipes exist", async () => {
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "dish_varieties") return chainable({ data: { id: 1 }, error: null });
      if (table === "recipes") return chainable({ data: [mockExpertRecipe], error: null });
    });

    const res = await request(app).get("/dish-varieties/1/recipes");

    expect(res.status).toBe(200);
    expect(res.body.data.expertRecipe).not.toBeNull();
    expect(res.body.data.communityRecipes).toHaveLength(0);
  });

  it("returns empty expertRecipe and empty communityRecipes when no recipes exist", async () => {
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "dish_varieties") return chainable({ data: { id: 1 }, error: null });
      if (table === "recipes") return chainable({ data: [], error: null });
    });

    const res = await request(app).get("/dish-varieties/1/recipes");

    expect(res.status).toBe(200);
    expect(res.body.data.expertRecipe).toBeNull();
    expect(res.body.data.communityRecipes).toHaveLength(0);
  });

  it("returns 404 when dish variety not found", async () => {
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "dish_varieties")
        return chainable({ data: null, error: { code: "PGRST116", message: "Not found" } });
    });

    const res = await request(app).get("/dish-varieties/999/recipes");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("returns 400 for non-integer id", async () => {
    const res = await request(app).get("/dish-varieties/abc/recipes");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for id = 0", async () => {
    const res = await request(app).get("/dish-varieties/0/recipes");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 500 on variety db error", async () => {
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "dish_varieties")
        return chainable({ data: null, error: { message: "DB timeout" } });
    });

    const res = await request(app).get("/dish-varieties/1/recipes");

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("DB_ERROR");
  });

  it("returns 500 on recipes db error", async () => {
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "dish_varieties") return chainable({ data: { id: 1 }, error: null });
      if (table === "recipes") return chainable({ data: null, error: { message: "DB timeout" } });
    });

    const res = await request(app).get("/dish-varieties/1/recipes");

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("DB_ERROR");
  });

  it("includes creator info in recipe items", async () => {
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "dish_varieties") return chainable({ data: { id: 1 }, error: null });
      if (table === "recipes") return chainable({ data: mockCommunityRecipes, error: null });
    });

    const res = await request(app).get("/dish-varieties/1/recipes");

    expect(res.status).toBe(200);
    const recipe = res.body.data.communityRecipes[0];
    expect(recipe.creator).toBeDefined();
    expect(recipe.creator.username).toBe("cook1");
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

  it("filters recipes by partial title match (search param)", async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: mockRecipes, error: null, count: 1 })
    );

    const res = await request(app).get("/discovery/recipes?search=adana");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.recipes).toHaveLength(1);
    expect(res.body.data.recipes[0].title).toBe("Adana Kebap");
  });

  it("returns empty when search matches no recipes", async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: [], error: null, count: 0 })
    );

    const res = await request(app).get("/discovery/recipes?search=xqzwnotarecipe");

    expect(res.status).toBe(200);
    expect(res.body.data.recipes).toHaveLength(0);
    expect(res.body.data.pagination.total).toBe(0);
  });

  it("treats empty search string as no filter", async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: mockRecipes, error: null, count: 1 })
    );

    const res = await request(app).get("/discovery/recipes?search=");

    expect(res.status).toBe(200);
    expect(res.body.data.recipes).toHaveLength(1);
  });

  it("trims whitespace-only search and applies no filter", async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: mockRecipes, error: null, count: 1 })
    );

    const res = await request(app).get("/discovery/recipes?search=   ");

    expect(res.status).toBe(200);
    expect(res.body.data.recipes).toHaveLength(1);
  });

  it("combines search with genreId filter", async () => {
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "dish_varieties") return chainable({ data: [{ id: 1 }], error: null });
      if (table === "recipes") return chainable({ data: mockRecipes, error: null, count: 1 });
    });

    const res = await request(app).get("/discovery/recipes?search=adana&genreId=1");

    expect(res.status).toBe(200);
    expect(res.body.data.recipes).toHaveLength(1);
    expect(res.body.data.recipes[0].title).toBe("Adana Kebap");
  });

  it("combines search with region filter", async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: mockRecipes, error: null, count: 1 })
    );

    const res = await request(app).get("/discovery/recipes?search=adana&region=Turkey");

    expect(res.status).toBe(200);
    expect(res.body.data.recipes).toHaveLength(1);
  });

  it("filters by country", async () => {
    const mockWithLocation = [{ ...mockRecipes[0], country: "Turkey", city: null, district: null }];
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: mockWithLocation, error: null, count: 1 })
    );

    const res = await request(app).get("/discovery/recipes?country=Turkey");

    expect(res.status).toBe(200);
    expect(res.body.data.recipes).toHaveLength(1);
    expect(res.body.data.recipes[0].country).toBe("Turkey");
  });

  it("filters by city", async () => {
    const mockWithLocation = [{ ...mockRecipes[0], country: "Turkey", city: "Adana", district: null }];
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: mockWithLocation, error: null, count: 1 })
    );

    const res = await request(app).get("/discovery/recipes?city=Adana");

    expect(res.status).toBe(200);
    expect(res.body.data.recipes).toHaveLength(1);
    expect(res.body.data.recipes[0].city).toBe("Adana");
  });

  it("filters by district", async () => {
    const mockWithLocation = [{ ...mockRecipes[0], country: "Turkey", city: "Adana", district: "Seyhan" }];
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: mockWithLocation, error: null, count: 1 })
    );

    const res = await request(app).get("/discovery/recipes?district=Seyhan");

    expect(res.status).toBe(200);
    expect(res.body.data.recipes).toHaveLength(1);
    expect(res.body.data.recipes[0].district).toBe("Seyhan");
  });

  it("filters by country, city, and district combined", async () => {
    const mockWithLocation = [{ ...mockRecipes[0], country: "Turkey", city: "Adana", district: "Seyhan" }];
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: mockWithLocation, error: null, count: 1 })
    );

    const res = await request(app).get("/discovery/recipes?country=Turkey&city=Adana&district=Seyhan");

    expect(res.status).toBe(200);
    expect(res.body.data.recipes).toHaveLength(1);
    expect(res.body.data.recipes[0].country).toBe("Turkey");
    expect(res.body.data.recipes[0].city).toBe("Adana");
    expect(res.body.data.recipes[0].district).toBe("Seyhan");
  });

  it("returns empty when country filter matches nothing", async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: [], error: null, count: 0 })
    );

    const res = await request(app).get("/discovery/recipes?country=Narnia");

    expect(res.status).toBe(200);
    expect(res.body.data.recipes).toHaveLength(0);
    expect(res.body.data.pagination.total).toBe(0);
  });

  it("combines country filter with genreId", async () => {
    const mockWithLocation = [{ ...mockRecipes[0], country: "Turkey", city: null, district: null }];
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "dish_varieties") return chainable({ data: [{ id: 1 }], error: null });
      if (table === "recipes") return chainable({ data: mockWithLocation, error: null, count: 1 });
    });

    const res = await request(app).get("/discovery/recipes?country=Turkey&genreId=1");

    expect(res.status).toBe(200);
    expect(res.body.data.recipes).toHaveLength(1);
    expect(res.body.data.recipes[0].country).toBe("Turkey");
  });

  it("combines country filter with search", async () => {
    const mockWithLocation = [{ ...mockRecipes[0], country: "Turkey", city: null, district: null }];
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: mockWithLocation, error: null, count: 1 })
    );

    const res = await request(app).get("/discovery/recipes?country=Turkey&search=adana");

    expect(res.status).toBe(200);
    expect(res.body.data.recipes).toHaveLength(1);
  });

  it("response includes country, city, district fields", async () => {
    const mockWithLocation = [{ ...mockRecipes[0], country: "Turkey", city: "Adana", district: null }];
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: mockWithLocation, error: null, count: 1 })
    );

    const res = await request(app).get("/discovery/recipes");

    expect(res.status).toBe(200);
    const recipe = res.body.data.recipes[0];
    expect(recipe).toHaveProperty("country");
    expect(recipe).toHaveProperty("city");
    expect(recipe).toHaveProperty("district");
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("GET /discovery/recipes/by-ingredients", () => {
  beforeEach(() => jest.clearAllMocks());

  const mockRecipes = [
    {
      id: 1, title: "Simple Salad", type: "community",
      average_rating: 4.2, rating_count: 10,
      created_at: "2024-01-01", updated_at: "2024-01-01",
      dish_variety: { id: 1, name: "Green Salad", dish_genre: { id: 1, name: "Salad" } },
      profile: { id: "p1", username: "cook1" },
    },
  ];

  it("returns recipes fully covered by provided ingredients", async () => {
    // recipe_ingredients NOT in list → no excluded recipes
    // recipe_ingredients IN list → recipe 1 is a candidate
    // recipes query → returns recipe 1
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "recipe_ingredients") {
        const call = (supabase.from as jest.Mock).mock.calls.filter(
          (c: any[]) => c[0] === "recipe_ingredients"
        ).length;
        if (call === 1) {
          // First call: NOT in ingredientIds → no rows (no missing ingredients)
          return chainable({ data: [], error: null });
        }
        // Second call: IN ingredientIds → recipe 1 uses these ingredients
        return chainable({ data: [{ recipe_id: 1 }], error: null });
      }
      if (table === "recipes") {
        return chainable({ data: mockRecipes, error: null, count: 1 });
      }
    });

    const res = await request(app).get("/discovery/recipes/by-ingredients?ingredientIds=1,2,3");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.recipes).toHaveLength(1);
    expect(res.body.data.recipes[0].title).toBe("Simple Salad");
    expect(res.body.data.pagination).toMatchObject({ page: 1, limit: 20, total: 1 });
  });

  it("excludes recipes with ingredients not in provided list", async () => {
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "recipe_ingredients") {
        const call = (supabase.from as jest.Mock).mock.calls.filter(
          (c: any[]) => c[0] === "recipe_ingredients"
        ).length;
        if (call === 1) {
          // Recipe 1 needs ingredient 5 which is NOT in the provided list
          return chainable({ data: [{ recipe_id: 1 }], error: null });
        }
        // Recipe 1 also uses ingredients in the provided list
        return chainable({ data: [{ recipe_id: 1 }], error: null });
      }
    });

    const res = await request(app).get("/discovery/recipes/by-ingredients?ingredientIds=1,2");

    expect(res.status).toBe(200);
    expect(res.body.data.recipes).toHaveLength(0);
    expect(res.body.data.pagination.total).toBe(0);
  });

  it("returns 400 when ingredientIds is missing", async () => {
    const res = await request(app).get("/discovery/recipes/by-ingredients");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when ingredientIds contains no valid numbers", async () => {
    const res = await request(app).get("/discovery/recipes/by-ingredients?ingredientIds=abc,xyz");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns empty when no recipes have ingredients matching the list", async () => {
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "recipe_ingredients") {
        return chainable({ data: [], error: null });
      }
    });

    const res = await request(app).get("/discovery/recipes/by-ingredients?ingredientIds=999");

    expect(res.status).toBe(200);
    expect(res.body.data.recipes).toHaveLength(0);
    expect(res.body.data.pagination.total).toBe(0);
  });

  it("respects pagination params", async () => {
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "recipe_ingredients") {
        const call = (supabase.from as jest.Mock).mock.calls.filter(
          (c: any[]) => c[0] === "recipe_ingredients"
        ).length;
        if (call === 1) return chainable({ data: [], error: null });
        return chainable({ data: [{ recipe_id: 1 }], error: null });
      }
      if (table === "recipes") {
        return chainable({ data: mockRecipes, error: null, count: 50 });
      }
    });

    const res = await request(app).get("/discovery/recipes/by-ingredients?ingredientIds=1,2&page=2&limit=10");

    expect(res.status).toBe(200);
    expect(res.body.data.pagination).toMatchObject({ page: 2, limit: 10, total: 50 });
  });

  it("returns 400 for invalid page param", async () => {
    const res = await request(app).get("/discovery/recipes/by-ingredients?ingredientIds=1&page=0");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for limit exceeding 100", async () => {
    const res = await request(app).get("/discovery/recipes/by-ingredients?ingredientIds=1&limit=200");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 500 on database error in exclusion query", async () => {
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "recipe_ingredients") {
        return chainable({ data: null, error: { message: "DB timeout" } });
      }
    });

    const res = await request(app).get("/discovery/recipes/by-ingredients?ingredientIds=1,2");

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("DB_ERROR");
  });

  it("returns 500 on database error in recipe fetch", async () => {
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "recipe_ingredients") {
        const call = (supabase.from as jest.Mock).mock.calls.filter(
          (c: any[]) => c[0] === "recipe_ingredients"
        ).length;
        if (call === 1) return chainable({ data: [], error: null });
        return chainable({ data: [{ recipe_id: 1 }], error: null });
      }
      if (table === "recipes") {
        return chainable({ data: null, error: { message: "DB timeout" }, count: null });
      }
    });

    const res = await request(app).get("/discovery/recipes/by-ingredients?ingredientIds=1,2");

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("DB_ERROR");
  });

  it("ignores negative and zero values in ingredientIds", async () => {
    const res = await request(app).get("/discovery/recipes/by-ingredients?ingredientIds=0,-1,-5");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("handles mixed valid and invalid ingredientIds gracefully", async () => {
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "recipe_ingredients") {
        const call = (supabase.from as jest.Mock).mock.calls.filter(
          (c: any[]) => c[0] === "recipe_ingredients"
        ).length;
        if (call === 1) return chainable({ data: [], error: null });
        return chainable({ data: [{ recipe_id: 1 }], error: null });
      }
      if (table === "recipes") {
        return chainable({ data: mockRecipes, error: null, count: 1 });
      }
    });

    const res = await request(app).get("/discovery/recipes/by-ingredients?ingredientIds=1,abc,2");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.recipes).toHaveLength(1);
  });
});
