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
  const methods = ["select", "eq", "neq", "in", "not", "or", "order", "range", "filter", "single", "limit", "ilike"];
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
      { id: 10, title: "Classic Adana", type: "community", average_rating: 4.5, rating_count: 12, created_at: "2024-01-01", updated_at: "2024-01-01" },
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
      id: 1, title: "Adana Kebap", type: "community",
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

  it("excludes recipes with specified allergens via allergen_ids overlap filter", async () => {
    const chain = chainable({ data: [], error: null, count: 0 });
    (supabase.from as jest.Mock).mockReturnValue(chain);

    const res = await request(app).get("/discovery/recipes?excludeAllergens=1");

    expect(res.status).toBe(200);
    expect(res.body.data.recipes).toHaveLength(0);
    expect(chain.not).toHaveBeenCalledWith("allergen_ids", "ov", "{1}");
  });

  it("applies allergen_ids overlap filter for multiple allergens", async () => {
    const chain = chainable({ data: [], error: null, count: 0 });
    (supabase.from as jest.Mock).mockReturnValue(chain);

    const res = await request(app).get("/discovery/recipes?excludeAllergens=1,2,3");

    expect(res.status).toBe(200);
    expect(chain.not).toHaveBeenCalledWith("allergen_ids", "ov", "{1,2,3}");
  });

  // ─── Derived allergen exclusion via ingredient_allergens (#518) ──────────
  // The manual allergen_ids column is mostly empty in real data, so the
  // overlap filter alone never excludes anything. Discovery must also derive
  // the exclusion set from ingredient_allergens → recipe_ingredients.

  it("excludes recipes whose ingredients carry the excluded allergen (via ingredient_allergens)", async () => {
    const recipeChain = chainable({ data: [], error: null, count: 0 });
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "ingredient_allergens") {
        // Allergen 1 is contained in ingredients 10 and 11.
        return chainable({
          data: [{ ingredient_id: 10 }, { ingredient_id: 11 }],
          error: null,
        });
      }
      if (table === "recipe_ingredients") {
        // Recipes "r-uuid-a" and "r-uuid-b" use those ingredients.
        return chainable({
          data: [
            { recipe_id: "r-uuid-a" },
            { recipe_id: "r-uuid-b" },
            { recipe_id: "r-uuid-a" }, // duplicate to verify dedup
          ],
          error: null,
        });
      }
      return recipeChain;
    });

    const res = await request(app).get("/discovery/recipes?excludeAllergens=1");

    expect(res.status).toBe(200);
    // Manual overlap filter still applied
    expect(recipeChain.not).toHaveBeenCalledWith("allergen_ids", "ov", "{1}");
    // Derived exclusion applied to the main query (and cascade via applyFilters)
    expect(recipeChain.not).toHaveBeenCalledWith(
      "id",
      "in",
      "(r-uuid-a,r-uuid-b)"
    );
  });

  it("skips the derived exclusion when no ingredients carry the excluded allergen", async () => {
    const recipeChain = chainable({ data: [], error: null, count: 0 });
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "ingredient_allergens") {
        return chainable({ data: [], error: null });
      }
      // recipe_ingredients should NOT be queried in this path.
      return recipeChain;
    });

    const res = await request(app).get("/discovery/recipes?excludeAllergens=99");

    expect(res.status).toBe(200);
    expect(recipeChain.not).toHaveBeenCalledWith("allergen_ids", "ov", "{99}");
    // No derived "id" NOT IN filter.
    const idNotInCall = (recipeChain.not as jest.Mock).mock.calls.find(
      (c: any[]) => c[0] === "id" && c[1] === "in"
    );
    expect(idNotInCall).toBeUndefined();
  });

  it("returns 500 when ingredient_allergens query fails", async () => {
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "ingredient_allergens") {
        return chainable({ data: null, error: { message: "DB timeout" } });
      }
      return chainable({ data: [], error: null, count: 0 });
    });

    const res = await request(app).get("/discovery/recipes?excludeAllergens=1");

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("DB_ERROR");
  });

  it("returns 500 when recipe_ingredients lookup for derived allergens fails", async () => {
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "ingredient_allergens") {
        return chainable({ data: [{ ingredient_id: 10 }], error: null });
      }
      if (table === "recipe_ingredients") {
        return chainable({ data: null, error: { message: "DB timeout" } });
      }
      return chainable({ data: [], error: null, count: 0 });
    });

    const res = await request(app).get("/discovery/recipes?excludeAllergens=1");

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("DB_ERROR");
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

  it("cascade reflects all filtered recipes, not just the current page (#463)", async () => {
    // Page 1 only returns the first recipe, but the cascade aggregation sees
    // every filtered recipe — so genres/varieties from later pages still
    // appear in the response.
    const pagedRecipes = [
      {
        id: 1, title: "Adana Kebap", type: "community",
        average_rating: 4.8, rating_count: 20, created_at: "2024-01-01", updated_at: "2024-01-01",
        dish_variety: { id: 1, name: "Adana Kebap", dish_genre: { id: 1, name: "Kebap" } },
        profile: { id: "p1", username: "cook1" },
      },
    ];
    const cascadeRecipes = [
      { dish_variety: { id: 1, name: "Adana Kebap", dish_genre: { id: 1, name: "Kebap" } } },
      { dish_variety: { id: 2, name: "Mercimek Çorbası", dish_genre: { id: 2, name: "Soup" } } },
      { dish_variety: { id: 3, name: "Baklava", dish_genre: { id: 3, name: "Pastries" } } },
    ];
    let call = 0;
    (supabase.from as jest.Mock).mockImplementation(() => {
      call += 1;
      // First .from("recipes") call is the paginated list, second is the cascade aggregation.
      return call === 1
        ? chainable({ data: pagedRecipes, error: null, count: 30 })
        : chainable({ data: cascadeRecipes, error: null });
    });

    const res = await request(app).get("/discovery/recipes?country=Turkey&page=1&limit=1");

    expect(res.status).toBe(200);
    expect(res.body.data.recipes).toHaveLength(1);
    expect(res.body.data.varieties.map((v: any) => v.id).sort()).toEqual([1, 2, 3]);
    expect(res.body.data.genres.map((g: any) => g.id).sort()).toEqual([1, 2, 3]);
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
      if (table === "recipe_translations") return chainable({ data: [], error: null });
      if (table === "recipes") return chainable({ data: mockRecipes, error: null, count: 1 });
    });

    const res = await request(app).get("/discovery/recipes?search=adana&genreId=1");

    expect(res.status).toBe(200);
    expect(res.body.data.recipes).toHaveLength(1);
    expect(res.body.data.recipes[0].title).toBe("Adana Kebap");
  });

  // ─── Bilingual title search via recipe_translations ──────────────────────
  // recipes.title only stores the authored language; the opposite language
  // lives in recipe_translations. Search must hit both so "English" finds a
  // TR-authored recipe via its EN translation row and vice versa (#????).

  it("includes recipes whose translated title matches the search term", async () => {
    const recipeChain = chainable({
      data: [
        {
          id: "r-tr-1",
          title: "Ege’nin Yeni İngilizce Sınavı Tarifi",
          type: "community",
          average_rating: 4.5,
          rating_count: 2,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
          dish_variety: null,
          profile: { id: "p1", username: "ege" },
        },
      ],
      error: null,
      count: 1,
    });

    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "recipe_translations") {
        // EN translation row of a TR-authored recipe matches "English".
        return chainable({
          data: [{ recipe_id: "r-tr-1" }],
          error: null,
        });
      }
      if (table === "recipes") return recipeChain;
    });

    const res = await request(app).get("/discovery/recipes?search=English");

    expect(res.status).toBe(200);
    expect(res.body.data.recipes).toHaveLength(1);
    expect(res.body.data.recipes[0].id).toBe("r-tr-1");
    // Main recipe query should OR title.ilike clauses with the matched IDs.
    const orCalls = (recipeChain.or as jest.Mock).mock.calls.map(
      (c: any[]) => c[0] as string
    );
    expect(
      orCalls.some(
        (f) => f.includes("title.ilike.") && f.includes("id.in.(r-tr-1)")
      )
    ).toBe(true);
  });

  it("returns 500 when the recipe_translations lookup fails", async () => {
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "recipe_translations") {
        return chainable({ data: null, error: { message: "DB timeout" } });
      }
      return chainable({ data: [], error: null, count: 0 });
    });

    const res = await request(app).get("/discovery/recipes?search=anything");

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("DB_ERROR");
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

  // ─── Region label normalization (issue #398) ───────────────────────────────
  // The origin filter must tolerate incidental differences in casing and
  // whitespace, otherwise valid recipes are dropped from filtered results.

  it("matches country case-insensitively (filter 'turkey' finds 'Turkey')", async () => {
    const mockWithLocation = [{ ...mockRecipes[0], country: "Turkey", city: null, district: null }];
    const chain = chainable({ data: mockWithLocation, error: null, count: 1 });
    (supabase.from as jest.Mock).mockReturnValue(chain);

    const res = await request(app).get("/discovery/recipes?country=turkey");

    expect(res.status).toBe(200);
    expect(res.body.data.recipes).toHaveLength(1);
    // "turkey" is in the alias table, so the filter expands to an OR over
    // every known variant (Turkey/Türkiye/tr/...) instead of a single ilike.
    expect(chain.or).toHaveBeenCalledTimes(2);
    const orArg = (chain.or as jest.Mock).mock.calls[0][0] as string;
    expect(orArg).toContain("country.ilike.Turkey");
    expect(orArg).toContain("country.ilike.tr");
    expect(orArg).toContain("country.ilike.turkiye");
    expect(chain.eq).not.toHaveBeenCalledWith("country", expect.anything());
  });

  it("matches city case-insensitively (filter 'ADANA' finds 'Adana')", async () => {
    const mockWithLocation = [{ ...mockRecipes[0], country: "Turkey", city: "Adana", district: null }];
    const chain = chainable({ data: mockWithLocation, error: null, count: 1 });
    (supabase.from as jest.Mock).mockReturnValue(chain);

    const res = await request(app).get("/discovery/recipes?city=ADANA");

    expect(res.status).toBe(200);
    expect(res.body.data.recipes).toHaveLength(1);
    expect(chain.ilike).toHaveBeenCalledWith("city", "ADANA");
  });

  it("matches district case-insensitively (filter 'seyhan' finds 'Seyhan')", async () => {
    const mockWithLocation = [{ ...mockRecipes[0], country: "Turkey", city: "Adana", district: "Seyhan" }];
    const chain = chainable({ data: mockWithLocation, error: null, count: 1 });
    (supabase.from as jest.Mock).mockReturnValue(chain);

    const res = await request(app).get("/discovery/recipes?district=seyhan");

    expect(res.status).toBe(200);
    expect(res.body.data.recipes).toHaveLength(1);
    expect(chain.ilike).toHaveBeenCalledWith("district", "seyhan");
  });

  it("trims and collapses whitespace on country filter input", async () => {
    const mockWithLocation = [{ ...mockRecipes[0], country: "Turkey", city: null, district: null }];
    const chain = chainable({ data: mockWithLocation, error: null, count: 1 });
    (supabase.from as jest.Mock).mockReturnValue(chain);

    const res = await request(app).get("/discovery/recipes?country=%20%20Turkey%20%20");

    expect(res.status).toBe(200);
    expect(res.body.data.recipes).toHaveLength(1);
    // Whitespace-padded "Turkey" is trimmed before alias lookup; the result
    // is an OR over Turkey variants (no leading/trailing spaces in any).
    expect(chain.or).toHaveBeenCalledTimes(2);
    const orArg = (chain.or as jest.Mock).mock.calls[0][0] as string;
    expect(orArg).toContain("country.ilike.Turkey");
    expect(orArg).not.toContain("  Turkey  ");
  });

  it("escapes ILIKE wildcards in country filter input", async () => {
    const chain = chainable({ data: [], error: null, count: 0 });
    (supabase.from as jest.Mock).mockReturnValue(chain);

    const res = await request(app).get("/discovery/recipes?country=100%25_organic");

    expect(res.status).toBe(200);
    expect(chain.ilike).toHaveBeenCalledWith("country", "100\\%\\_organic");
  });

  // ─── Alias + diacritic resolution (issue #398) ────────────────────────────
  // The origin filter must not silently drop recipes when the user types a
  // country in a different surface form than what is stored in the DB.
  // E.g. recipe stored as "Turkey", filter sent as "tr" / "TUR" / "Türkiye".

  it("matches stored 'Turkey' when filter is 'tr' (ISO-2 alias)", async () => {
    const chain = chainable({
      data: [{ ...mockRecipes[0], country: "Turkey", city: null, district: null }],
      error: null,
      count: 1,
    });
    (supabase.from as jest.Mock).mockReturnValue(chain);

    const res = await request(app).get("/discovery/recipes?country=tr");

    expect(res.status).toBe(200);
    expect(res.body.data.recipes).toHaveLength(1);
    expect(chain.or).toHaveBeenCalledTimes(2);
    const orArg = (chain.or as jest.Mock).mock.calls[0][0] as string;
    expect(orArg).toContain("country.ilike.Turkey");
    expect(orArg).toContain("country.ilike.tr");
    expect(orArg).toContain("country.ilike.turkiye");
  });

  it("matches stored 'Turkey' when filter is 'Türkiye' (folds diacritics)", async () => {
    const chain = chainable({
      data: [{ ...mockRecipes[0], country: "Turkey", city: null, district: null }],
      error: null,
      count: 1,
    });
    (supabase.from as jest.Mock).mockReturnValue(chain);

    const res = await request(app).get(
      "/discovery/recipes?country=" + encodeURIComponent("Türkiye")
    );

    expect(res.status).toBe(200);
    expect(res.body.data.recipes).toHaveLength(1);
    expect(chain.or).toHaveBeenCalledTimes(2);
    const orArg = (chain.or as jest.Mock).mock.calls[0][0] as string;
    expect(orArg).toContain("country.ilike.Turkey");
  });

  it("matches stored 'Türkiye' when filter is 'Turkey' (legacy DB rows)", async () => {
    // Existing rows may still hold "Türkiye" — the OR over variants should
    // include the variant form too.
    const chain = chainable({
      data: [{ ...mockRecipes[0], country: "Türkiye", city: null, district: null }],
      error: null,
      count: 1,
    });
    (supabase.from as jest.Mock).mockReturnValue(chain);

    const res = await request(app).get("/discovery/recipes?country=Turkey");

    expect(res.status).toBe(200);
    expect(res.body.data.recipes).toHaveLength(1);
    const orArg = (chain.or as jest.Mock).mock.calls[0][0] as string;
    expect(orArg).toContain("country.ilike.turkiye");
  });

  it("matches stored 'Türkiye' when filter is uppercase 'TÜRKIYE'", async () => {
    const chain = chainable({
      data: [{ ...mockRecipes[0], country: "Türkiye", city: null, district: null }],
      error: null,
      count: 1,
    });
    (supabase.from as jest.Mock).mockReturnValue(chain);

    const res = await request(app).get(
      "/discovery/recipes?country=" + encodeURIComponent("TÜRKIYE")
    );

    expect(res.status).toBe(200);
    expect(res.body.data.recipes).toHaveLength(1);
    expect(chain.or).toHaveBeenCalledTimes(2);
  });

  it("expands 'usa' to United States variants (not turkey-only)", async () => {
    const chain = chainable({
      data: [{ ...mockRecipes[0], country: "United States", city: null, district: null }],
      error: null,
      count: 1,
    });
    (supabase.from as jest.Mock).mockReturnValue(chain);

    const res = await request(app).get("/discovery/recipes?country=usa");

    expect(res.status).toBe(200);
    const orArg = (chain.or as jest.Mock).mock.calls[0][0] as string;
    expect(orArg).toContain("country.ilike.United States");
    expect(orArg).toContain("country.ilike.us");
    expect(orArg).not.toContain("Turkey");
  });

  it("falls back to a single ilike for non-alias countries (e.g. Narnia)", async () => {
    const chain = chainable({ data: [], error: null, count: 0 });
    (supabase.from as jest.Mock).mockReturnValue(chain);

    const res = await request(app).get("/discovery/recipes?country=Narnia");

    expect(res.status).toBe(200);
    // Not in alias table → simple ilike, no .or() expansion.
    expect(chain.ilike).toHaveBeenCalledWith("country", "Narnia");
    expect(chain.or).not.toHaveBeenCalled();
  });

  // ─── Origin filter cascade (#401) ────────────────────────────────────────
  // Matched recipes cascade up: their parent variety and genre are collected
  // into distinct `varieties` and `genres` arrays in the response.

  it("response always includes varieties and genres fields", async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: mockRecipes, error: null, count: 1 })
    );

    const res = await request(app).get("/discovery/recipes");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("varieties");
    expect(res.body.data).toHaveProperty("genres");
  });

  it("cascade: recipe variety appears in varieties list", async () => {
    const recipe = {
      ...mockRecipes[0],
      country: "Turkey",
      dish_variety: { id: 1, name: "Adana Kebap", dish_genre: { id: 1, name: "Kebap" } },
    };
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: [recipe], error: null, count: 1 })
    );

    const res = await request(app).get("/discovery/recipes?country=Turkey");

    expect(res.status).toBe(200);
    expect(res.body.data.varieties).toHaveLength(1);
    expect(res.body.data.varieties[0].id).toBe(1);
    expect(res.body.data.varieties[0].name).toBe("Adana Kebap");
  });

  it("cascade: recipe genre appears in genres list", async () => {
    const recipe = {
      ...mockRecipes[0],
      country: "Turkey",
      dish_variety: { id: 1, name: "Adana Kebap", dish_genre: { id: 1, name: "Kebap" } },
    };
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: [recipe], error: null, count: 1 })
    );

    const res = await request(app).get("/discovery/recipes?country=Turkey");

    expect(res.status).toBe(200);
    expect(res.body.data.genres).toHaveLength(1);
    expect(res.body.data.genres[0].id).toBe(1);
    expect(res.body.data.genres[0].name).toBe("Kebap");
  });

  it("cascade: multiple recipes from the same variety yield a single variety entry", async () => {
    const sharedVariety = { id: 1, name: "Adana Kebap", dish_genre: { id: 1, name: "Kebap" } };
    const recipes = [
      { ...mockRecipes[0], id: 1, country: "Turkey", dish_variety: sharedVariety },
      { ...mockRecipes[0], id: 2, country: "Turkey", dish_variety: sharedVariety },
    ];
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: recipes, error: null, count: 2 })
    );

    const res = await request(app).get("/discovery/recipes?country=Turkey");

    expect(res.status).toBe(200);
    expect(res.body.data.varieties).toHaveLength(1);
  });

  it("cascade: multiple varieties from the same genre yield a single genre entry", async () => {
    const genre = { id: 1, name: "Kebap" };
    const recipes = [
      { ...mockRecipes[0], id: 1, country: "Turkey", dish_variety: { id: 1, name: "Adana Kebap", dish_genre: genre } },
      { ...mockRecipes[0], id: 2, country: "Turkey", dish_variety: { id: 2, name: "Urfa Kebap", dish_genre: genre } },
    ];
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: recipes, error: null, count: 2 })
    );

    const res = await request(app).get("/discovery/recipes?country=Turkey");

    expect(res.status).toBe(200);
    expect(res.body.data.varieties).toHaveLength(2);
    expect(res.body.data.genres).toHaveLength(1);
  });

  it("cascade: multiple genres appear when recipes span different genres", async () => {
    const recipes = [
      { ...mockRecipes[0], id: 1, dish_variety: { id: 1, name: "Adana Kebap", dish_genre: { id: 1, name: "Kebap" } } },
      { ...mockRecipes[0], id: 2, dish_variety: { id: 2, name: "Mercimek", dish_genre: { id: 2, name: "Çorba" } } },
    ];
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: recipes, error: null, count: 2 })
    );

    const res = await request(app).get("/discovery/recipes");

    expect(res.status).toBe(200);
    expect(res.body.data.varieties).toHaveLength(2);
    expect(res.body.data.genres).toHaveLength(2);
  });

  it("cascade: empty varieties and genres when no recipes match", async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: [], error: null, count: 0 })
    );

    const res = await request(app).get("/discovery/recipes?country=Narnia");

    expect(res.status).toBe(200);
    expect(res.body.data.varieties).toHaveLength(0);
    expect(res.body.data.genres).toHaveLength(0);
  });

  it("cascade: recipe with null dish_variety produces no variety or genre entry", async () => {
    const recipe = { ...mockRecipes[0], dish_variety: null };
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: [recipe], error: null, count: 1 })
    );

    const res = await request(app).get("/discovery/recipes");

    expect(res.status).toBe(200);
    expect(res.body.data.varieties).toHaveLength(0);
    expect(res.body.data.genres).toHaveLength(0);
  });

  it("cascade: variety with null dish_genre produces no genre entry but variety is included", async () => {
    const recipe = {
      ...mockRecipes[0],
      dish_variety: { id: 1, name: "Adana Kebap", dish_genre: null },
    };
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: [recipe], error: null, count: 1 })
    );

    const res = await request(app).get("/discovery/recipes");

    expect(res.status).toBe(200);
    expect(res.body.data.varieties).toHaveLength(1);
    expect(res.body.data.genres).toHaveLength(0);
  });

  it("cascade: variety object in response includes dish_genre field", async () => {
    const recipe = {
      ...mockRecipes[0],
      country: "Turkey",
      dish_variety: { id: 1, name: "Adana Kebap", dish_genre: { id: 1, name: "Kebap" } },
    };
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: [recipe], error: null, count: 1 })
    );

    const res = await request(app).get("/discovery/recipes?country=Turkey");

    expect(res.status).toBe(200);
    expect(res.body.data.varieties[0].dish_genre).toMatchObject({ id: 1, name: "Kebap" });
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

// ─────────────────────────────────────────────────────────────────────────────

describe("GET /discovery/locations", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns distinct countries sorted alphabetically", async () => {
    const mockRows = [
      { country: "Turkey", city: null, district: null },
      { country: "Italy", city: null, district: null },
      { country: "Turkey", city: null, district: null },
    ];
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: mockRows, error: null })
    );

    const res = await request(app).get("/discovery/locations");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.results).toEqual(["Italy", "Turkey"]);
  });

  it("returns distinct cities scoped to a country", async () => {
    const mockRows = [
      { country: "Turkey", city: "Istanbul", district: null },
      { country: "Turkey", city: "Gaziantep", district: null },
      { country: "Turkey", city: "Istanbul", district: null },
    ];
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: mockRows, error: null })
    );

    const res = await request(app).get("/discovery/locations?country=Turkey");

    expect(res.status).toBe(200);
    expect(res.body.data.results).toEqual(["Gaziantep", "Istanbul"]);
  });

  it("returns distinct districts scoped to country and city", async () => {
    const mockRows = [
      { country: "Turkey", city: "Istanbul", district: "Kadıköy" },
      { country: "Turkey", city: "Istanbul", district: "Şişli" },
      { country: "Turkey", city: "Istanbul", district: "Kadıköy" },
    ];
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: mockRows, error: null })
    );

    const res = await request(app).get("/discovery/locations?country=Turkey&city=Istanbul");

    expect(res.status).toBe(200);
    expect(res.body.data.results).toEqual(["Kadıköy", "Şişli"]);
  });

  it("returns 400 when city is provided without country", async () => {
    const res = await request(app).get("/discovery/locations?city=Istanbul");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns empty array when no published recipes exist for the location", async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: [], error: null })
    );

    const res = await request(app).get("/discovery/locations?country=Japan");

    expect(res.status).toBe(200);
    expect(res.body.data.results).toEqual([]);
  });

  it("excludes null and empty string location values", async () => {
    const mockRows = [
      { country: "Turkey", city: null, district: null },
      { country: "", city: null, district: null },
      { country: "Italy", city: null, district: null },
    ];
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: mockRows, error: null })
    );

    const res = await request(app).get("/discovery/locations");

    expect(res.status).toBe(200);
    expect(res.body.data.results).toEqual(["Italy", "Turkey"]);
  });

  it("returns 500 on database error", async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: null, error: { message: "DB connection failed" } })
    );

    const res = await request(app).get("/discovery/locations");

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("DB_ERROR");
  });

  // ─── Region label normalization (issue #398) ───────────────────────────────

  it("deduplicates countries case-insensitively", async () => {
    const mockRows = [
      { country: "Turkey", city: null, district: null },
      { country: "TURKEY", city: null, district: null },
      { country: "turkey", city: null, district: null },
      { country: "Italy", city: null, district: null },
    ];
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: mockRows, error: null })
    );

    const res = await request(app).get("/discovery/locations");

    expect(res.status).toBe(200);
    expect(res.body.data.results).toEqual(["Italy", "Turkey"]);
  });

  it("matches parent country case-insensitively when listing cities", async () => {
    const mockRows = [
      { country: "Turkey", city: "Istanbul", district: null },
      { country: "Turkey", city: "Adana", district: null },
    ];
    const chain = chainable({ data: mockRows, error: null });
    (supabase.from as jest.Mock).mockReturnValue(chain);

    const res = await request(app).get("/discovery/locations?country=turkey");

    expect(res.status).toBe(200);
    expect(res.body.data.results).toEqual(["Adana", "Istanbul"]);
    // Turkey is in the alias table, so the filter is an OR over variants.
    expect(chain.or).toHaveBeenCalledTimes(1);
    const orArg = (chain.or as jest.Mock).mock.calls[0][0] as string;
    expect(orArg).toContain("country.ilike.Turkey");
    expect(orArg).toContain("country.ilike.turkiye");
  });

  it("matches parent country and city case-insensitively when listing districts", async () => {
    const mockRows = [
      { country: "Turkey", city: "Istanbul", district: "Kadıköy" },
      { country: "Turkey", city: "Istanbul", district: "Şişli" },
    ];
    const chain = chainable({ data: mockRows, error: null });
    (supabase.from as jest.Mock).mockReturnValue(chain);

    const res = await request(app).get("/discovery/locations?country=TURKEY&city=istanbul");

    expect(res.status).toBe(200);
    expect(res.body.data.results).toEqual(["Kadıköy", "Şişli"]);
    // Country goes through the alias-OR; city is not in the alias table so
    // it falls through to a single ilike.
    expect(chain.or).toHaveBeenCalledTimes(1);
    const orArg = (chain.or as jest.Mock).mock.calls[0][0] as string;
    expect(orArg).toContain("country.ilike.Turkey");
    expect(chain.ilike).toHaveBeenCalledWith("city", "istanbul");
  });

  it("trims and collapses whitespace in country filter input", async () => {
    const mockRows = [
      { country: "Turkey", city: "Istanbul", district: null },
    ];
    const chain = chainable({ data: mockRows, error: null });
    (supabase.from as jest.Mock).mockReturnValue(chain);

    const res = await request(app).get("/discovery/locations?country=%20%20Turkey%20%20");

    expect(res.status).toBe(200);
    expect(chain.or).toHaveBeenCalledTimes(1);
    const orArg = (chain.or as jest.Mock).mock.calls[0][0] as string;
    expect(orArg).toContain("country.ilike.Turkey");
    expect(orArg).not.toContain("  Turkey  ");
  });

  // ─── Alias-aware dedup (issue #398) ───────────────────────────────────────
  // Legacy data may hold the same place under several surface forms. The
  // distinct list returned to clients should collapse them into one entry.

  it("collapses 'Turkey' / 'Türkiye' / 'TR' into a single canonical entry", async () => {
    const mockRows = [
      { country: "Turkey", city: null, district: null },
      { country: "Türkiye", city: null, district: null },
      { country: "TR", city: null, district: null },
      { country: "TUR", city: null, district: null },
      { country: "Italy", city: null, district: null },
    ];
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: mockRows, error: null })
    );

    const res = await request(app).get("/discovery/locations");

    expect(res.status).toBe(200);
    expect(res.body.data.results).toEqual(["Italy", "Turkey"]);
  });

  it("returns the canonical display name even when the DB row is an alias form", async () => {
    const mockRows = [
      { country: "TR", city: null, district: null },
      { country: "tr", city: null, district: null },
    ];
    (supabase.from as jest.Mock).mockReturnValue(
      chainable({ data: mockRows, error: null })
    );

    const res = await request(app).get("/discovery/locations");

    expect(res.status).toBe(200);
    // Even though the DB only has "TR"/"tr", the API surfaces "Turkey".
    expect(res.body.data.results).toEqual(["Turkey"]);
  });

  it("filtering by 'tr' returns cities from rows stored as 'Turkey'", async () => {
    const mockRows = [
      { country: "Turkey", city: "Istanbul", district: null },
      { country: "Türkiye", city: "Adana", district: null },
    ];
    const chain = chainable({ data: mockRows, error: null });
    (supabase.from as jest.Mock).mockReturnValue(chain);

    const res = await request(app).get("/discovery/locations?country=tr");

    expect(res.status).toBe(200);
    expect(res.body.data.results).toEqual(["Adana", "Istanbul"]);
    expect(chain.or).toHaveBeenCalledTimes(1);
    const orArg = (chain.or as jest.Mock).mock.calls[0][0] as string;
    expect(orArg).toContain("country.ilike.Turkey");
    expect(orArg).toContain("country.ilike.turkiye");
  });
});
