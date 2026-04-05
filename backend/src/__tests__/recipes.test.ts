import request from "supertest";
import app from "../index.js";
import { supabase } from "../config/supabase.js";

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

// ─── GET /recipes/:id ────────────────────────────────────────────────────────

describe("GET /recipes/:id", () => {
  beforeEach(() => jest.clearAllMocks());

  const mockRecipeData = {
    id: "recipe-uuid-1",
    title: "Classic Adana Kebap",
    story: "A traditional recipe.",
    video_url: "https://example.com/video.mp4",
    serving_size: 4,
    type: "community",
    is_published: true,
    average_rating: 4.5,
    rating_count: 10,
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
    creator: { id: "profile-1", username: "cook1" },
    dish_variety: { id: 2, name: "Adana Kebap", dish_genre: { id: 1, name: "Kebap" } },
    recipe_ingredients: [
      {
        id: 1, quantity: 500, unit: "g",
        ingredient: { id: 2, name: "Minced Meat", ingredient_allergens: [] },
      },
    ],
    recipe_steps: [
      { id: 2, step_order: 2, description: "Grill for 10 minutes." },
      { id: 1, step_order: 1, description: "Mix with spices." },
    ],
    recipe_tools: [{ id: 1, name: "Grill" }],
    recipe_media: [{ id: 1, url: "https://example.com/img.jpg", type: "image" }],
  };

  const setupRecipeMock = (data: any, error: any) => {
    const mockSingle = jest.fn().mockResolvedValue({ data, error });
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "recipes") return { select: mockSelect };
      return {};
    });
  };

  it("returns full recipe detail with 200", async () => {
    setupRecipeMock(mockRecipeData, null);
    const res = await request(app).get("/recipes/recipe-uuid-1");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe("Classic Adana Kebap");
    expect(res.body.data.creatorUsername).toBe("cook1");
    expect(res.body.data.dishVarietyName).toBe("Adana Kebap");
    expect(res.body.data.genreName).toBe("Kebap");
    expect(res.body.data.averageRating).toBe(4.5);
    expect(res.body.data.ratingCount).toBe(10);
  });

  it("returns steps sorted by stepOrder", async () => {
    setupRecipeMock(mockRecipeData, null);
    const res = await request(app).get("/recipes/recipe-uuid-1");
    expect(res.status).toBe(200);
    expect(res.body.data.steps[0].stepOrder).toBe(1);
    expect(res.body.data.steps[0].description).toBe("Mix with spices.");
    expect(res.body.data.steps[1].stepOrder).toBe(2);
  });

  it("returns ingredients with allergens array", async () => {
    const dataWithAllergens = {
      ...mockRecipeData,
      recipe_ingredients: [
        {
          id: 1, quantity: 500, unit: "g",
          ingredient: {
            id: 2, name: "Minced Meat",
            ingredient_allergens: [{ allergen: { name: "gluten" } }],
          },
        },
      ],
    };
    setupRecipeMock(dataWithAllergens, null);
    const res = await request(app).get("/recipes/recipe-uuid-1");
    expect(res.status).toBe(200);
    expect(res.body.data.ingredients[0].allergens).toEqual(["gluten"]);
    expect(res.body.data.ingredients[0].ingredientName).toBe("Minced Meat");
    expect(res.body.data.ingredients[0].quantity).toBe(500);
    expect(res.body.data.ingredients[0].unit).toBe("g");
  });

  it("returns empty arrays when no ingredients, steps, tools, or media", async () => {
    setupRecipeMock(
      { ...mockRecipeData, recipe_ingredients: [], recipe_steps: [], recipe_tools: [], recipe_media: [] },
      null
    );
    const res = await request(app).get("/recipes/recipe-uuid-1");
    expect(res.status).toBe(200);
    expect(res.body.data.ingredients).toHaveLength(0);
    expect(res.body.data.steps).toHaveLength(0);
    expect(res.body.data.tools).toHaveLength(0);
    expect(res.body.data.media).toHaveLength(0);
  });

  it("returns null for optional fields when not set", async () => {
    setupRecipeMock(
      { ...mockRecipeData, story: null, video_url: null, serving_size: null, average_rating: null, dish_variety: null, creator: null },
      null
    );
    const res = await request(app).get("/recipes/recipe-uuid-1");
    expect(res.status).toBe(200);
    expect(res.body.data.story).toBeNull();
    expect(res.body.data.videoUrl).toBeNull();
    expect(res.body.data.servingSize).toBeNull();
    expect(res.body.data.averageRating).toBeNull();
    expect(res.body.data.creatorId).toBeNull();
    expect(res.body.data.dishVarietyId).toBeNull();
  });

  it("returns country, city, district when set", async () => {
    setupRecipeMock(
      { ...mockRecipeData, country: "Turkey", city: "Adana", district: "Seyhan" },
      null
    );
    const res = await request(app).get("/recipes/recipe-uuid-1");
    expect(res.status).toBe(200);
    expect(res.body.data.country).toBe("Turkey");
    expect(res.body.data.city).toBe("Adana");
    expect(res.body.data.district).toBe("Seyhan");
  });

  it("returns null for country, city, district when not set", async () => {
    setupRecipeMock(
      { ...mockRecipeData, country: null, city: null, district: null },
      null
    );
    const res = await request(app).get("/recipes/recipe-uuid-1");
    expect(res.status).toBe(200);
    expect(res.body.data.country).toBeNull();
    expect(res.body.data.city).toBeNull();
    expect(res.body.data.district).toBeNull();
  });

  it("returns 404 when recipe does not exist", async () => {
    setupRecipeMock(null, { code: "PGRST116", message: "Not found" });
    const res = await request(app).get("/recipes/nonexistent-uuid");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("returns 500 on database error", async () => {
    setupRecipeMock(null, { code: "500", message: "DB timeout" });
    const res = await request(app).get("/recipes/recipe-uuid-1");
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("DB_ERROR");
  });
});

// ─── GET /recipes/mine ───────────────────────────────────────────────────────

describe("GET /recipes/mine", () => {
  beforeEach(() => jest.clearAllMocks());

  const setupMineMock = (data: any) => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: "auth-user-1", email: "test@example.com" } },
      error: null,
    });

    const recipeChain: any = {};
    recipeChain.select = jest.fn().mockReturnValue(recipeChain);
    recipeChain.eq = jest.fn().mockReturnValue(recipeChain);
    recipeChain.order = jest.fn().mockResolvedValue({ data, error: null });

    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "profiles") {
        const mockSingle = jest.fn().mockResolvedValue({
          data: { id: "profile-1", username: "cook1", role: "cook" },
          error: null,
        });
        return { select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ single: mockSingle }) }) };
      }
      if (table === "recipes") return recipeChain;
      return {};
    });
  };

  it("returns 401 if no token provided", async () => {
    const res = await request(app).get("/recipes/mine");
    expect(res.status).toBe(401);
  });

  it("returns all recipes (draft + published) for authenticated user", async () => {
    const mockRecipes = [
      { id: "r1", title: "Published Recipe", type: "community", is_published: true, average_rating: 4.5, rating_count: 10, country: "Turkey", city: null, district: null, created_at: "2024-02-01", updated_at: "2024-02-01", recipe_media: [{ id: 1, url: "https://example.com/img.jpg", type: "image" }] },
      { id: "r2", title: "Draft Recipe", type: "community", is_published: false, average_rating: null, rating_count: 0, country: null, city: null, district: null, created_at: "2024-01-01", updated_at: "2024-01-01", recipe_media: [] },
    ];
    setupMineMock(mockRecipes);

    const res = await request(app).get("/recipes/mine").set("Authorization", "Bearer valid-token");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].isPublished).toBe(true);
    expect(res.body.data[1].isPublished).toBe(false);
  });

  it("returns empty array when user has no recipes", async () => {
    setupMineMock([]);

    const res = await request(app).get("/recipes/mine").set("Authorization", "Bearer valid-token");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it("returns correct response shape", async () => {
    const mockRecipes = [
      { id: "r1", title: "My Recipe", type: "community", is_published: true, average_rating: 4.0, rating_count: 5, country: "Turkey", city: "Adana", district: null, created_at: "2024-01-01", updated_at: "2024-01-01", recipe_media: [{ id: 1, url: "https://example.com/img.jpg", type: "image" }] },
    ];
    setupMineMock(mockRecipes);

    const res = await request(app).get("/recipes/mine").set("Authorization", "Bearer valid-token");

    expect(res.status).toBe(200);
    expect(res.body.data[0]).toMatchObject({
      id: "r1",
      title: "My Recipe",
      type: "community",
      isPublished: true,
      averageRating: 4.0,
      ratingCount: 5,
      country: "Turkey",
      city: "Adana",
      district: null,
      coverImageUrl: "https://example.com/img.jpg",
    });
  });

  it("filters by status=published", async () => {
    const mockPublished = [
      { id: "r1", title: "Published", type: "community", is_published: true, average_rating: 4.0, rating_count: 5, country: null, city: null, district: null, created_at: "2024-01-01", updated_at: "2024-01-01", recipe_media: [] },
    ];
    setupMineMock(mockPublished);

    const res = await request(app).get("/recipes/mine?status=published").set("Authorization", "Bearer valid-token");

    expect(res.status).toBe(200);
    expect(res.body.data[0].isPublished).toBe(true);
  });

  it("filters by status=draft", async () => {
    const mockDrafts = [
      { id: "r2", title: "Draft", type: "community", is_published: false, average_rating: null, rating_count: 0, country: null, city: null, district: null, created_at: "2024-01-01", updated_at: "2024-01-01", recipe_media: [] },
    ];
    setupMineMock(mockDrafts);

    const res = await request(app).get("/recipes/mine?status=draft").set("Authorization", "Bearer valid-token");

    expect(res.status).toBe(200);
    expect(res.body.data[0].isPublished).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Recipe Endpoints (Creation & Publishing)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validCommunityPayload = {
    dishVarietyId: 1,
    title: "Test Recipe",
    servingSize: 4,
    type: "community",
    ingredients: [{ ingredientId: 1, quantity: 1, unit: "cup" }],
    steps: [{ stepOrder: 1, description: "Mix" }],
  };

  const validCulturalPayload = {
    ...validCommunityPayload,
    type: "cultural",
  };

  const validIncompletePayload = {
    title: "Just a draft",
    type: "community",
  };

  // Centralized mock to handle profiles seamlessly.
  const setupMocks = (
    role: string,
    profileId = "profile-123",
    recipeFromMock?: (table: string) => any
  ) => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    });

    (supabase.from as jest.Mock).mockImplementation((table) => {
      // Always handle profiles
      if (table === "profiles") {
        const mockSingle = jest.fn().mockResolvedValue({
          data: { id: profileId, username: "tester", role },
          error: null,
        });
        const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
        return { select: jest.fn().mockReturnValue({ eq: mockEq }) };
      }
      // Delegate to custom mock for other tables
      if (recipeFromMock) {
        return recipeFromMock(table);
      }
      return { select: jest.fn(), insert: jest.fn(), update: jest.fn(), delete: jest.fn() };
    });
  };

  describe("POST /recipes", () => {
    it("should return 401 if not authenticated", async () => {
      const response = await request(app).post("/recipes").send(validCommunityPayload);
      expect(response.status).toBe(401);
    });

    it("should return 403 if user is a learner", async () => {
      setupMocks("learner");
      const response = await request(app)
        .post("/recipes")
        .set("Authorization", "Bearer valid_token")
        .send(validCommunityPayload);
      
      expect(response.status).toBe(403);
      expect(response.body.error.message).toContain("roles: cook, expert");
    });

    it("should return 403 if a cook tries to create a cultural recipe", async () => {
      setupMocks("cook");
      const response = await request(app)
        .post("/recipes")
        .set("Authorization", "Bearer valid_token")
        .send(validCulturalPayload);

      expect(response.status).toBe(403);
      expect(response.body.error.message).toBe("Cooks can only create community recipes.");
    });

    it("should return 400 for validation errors", async () => {
      setupMocks("cook");
      const response = await request(app)
        .post("/recipes")
        .set("Authorization", "Bearer valid_token")
        .send({ title: "hi" });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should return 201 for valid expert creating cultural recipe", async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: { id: "recipe-1", created_at: "2023-01-01" },
      });
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });

      setupMocks("expert", "profile-123", (table) => {
        if (table === "recipes") return { insert: mockInsert };
        return { insert: jest.fn().mockResolvedValue({ error: null }) };
      });

      const response = await request(app)
        .post("/recipes")
        .set("Authorization", "Bearer valid_token")
        .send(validCulturalPayload);

      expect(response.status).toBe(201);
      expect(response.body.data.type).toBe("cultural");
      expect(response.body.data.id).toBe("recipe-1");
    });

    it("should return 201 with location fields when provided", async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: { id: "recipe-loc-1", created_at: "2023-01-01" },
      });
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });

      setupMocks("cook", "profile-123", (table) => {
        if (table === "recipes") return { insert: mockInsert };
        return { insert: jest.fn().mockResolvedValue({ error: null }) };
      });

      const response = await request(app)
        .post("/recipes")
        .set("Authorization", "Bearer valid_token")
        .send({ ...validCommunityPayload, country: "Turkey", city: "Adana", district: "Seyhan" });

      expect(response.status).toBe(201);
      expect(response.body.data.country).toBe("Turkey");
      expect(response.body.data.city).toBe("Adana");
      expect(response.body.data.district).toBe("Seyhan");
    });

    it("should return 201 with null location fields when not provided", async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: { id: "recipe-no-loc-1", created_at: "2023-01-01" },
      });
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });

      setupMocks("cook", "profile-123", (table) => {
        if (table === "recipes") return { insert: mockInsert };
        return { insert: jest.fn().mockResolvedValue({ error: null }) };
      });

      const response = await request(app)
        .post("/recipes")
        .set("Authorization", "Bearer valid_token")
        .send(validCommunityPayload);

      expect(response.status).toBe(201);
      expect(response.body.data.country).toBeNull();
      expect(response.body.data.city).toBeNull();
      expect(response.body.data.district).toBeNull();
    });

    it("should trim whitespace from location fields", async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: { id: "recipe-trim-1", created_at: "2023-01-01" },
      });
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });

      setupMocks("cook", "profile-123", (table) => {
        if (table === "recipes") return { insert: mockInsert };
        return { insert: jest.fn().mockResolvedValue({ error: null }) };
      });

      const response = await request(app)
        .post("/recipes")
        .set("Authorization", "Bearer valid_token")
        .send({ ...validCommunityPayload, country: "  Turkey  ", city: "  Adana  " });

      expect(response.status).toBe(201);
      expect(response.body.data.country).toBe("Turkey");
      expect(response.body.data.city).toBe("Adana");
    });

    it("should return 201 with only country provided", async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: { id: "recipe-partial-1", created_at: "2023-01-01" },
      });
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });

      setupMocks("cook", "profile-123", (table) => {
        if (table === "recipes") return { insert: mockInsert };
        return { insert: jest.fn().mockResolvedValue({ error: null }) };
      });

      const response = await request(app)
        .post("/recipes")
        .set("Authorization", "Bearer valid_token")
        .send({ ...validCommunityPayload, country: "Greece" });

      expect(response.status).toBe(201);
      expect(response.body.data.country).toBe("Greece");
      expect(response.body.data.city).toBeNull();
      expect(response.body.data.district).toBeNull();
    });

    it("should return 201 for valid incomplete draft", async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: { id: "recipe-draft-1", created_at: "2023-01-01" },
      });
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });

      setupMocks("cook", "profile-123", (table) => {
        if (table === "recipes") return { insert: mockInsert };
        return { insert: jest.fn().mockResolvedValue({ error: null }) };
      });

      const response = await request(app)
        .post("/recipes")
        .set("Authorization", "Bearer valid_token")
        .send(validIncompletePayload);

      expect(response.status).toBe(201);
      expect(response.body.data.dishVarietyId).toBeNull();
      expect(response.body.data.id).toBe("recipe-draft-1");
    });
  });

  describe("POST /recipes/:id/publish", () => {
    it("should return 404 if recipe not found", async () => {
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      setupMocks("cook", "profile-123", (table) => {
        if (table === "recipes") return { select: mockSelect };
        return {};
      });

      const response = await request(app)
        .post("/recipes/123/publish")
        .set("Authorization", "Bearer valid_token")
        .send();

      expect(response.status).toBe(404);
    });

    it("should return 403 if not the creator", async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: { creator_id: "profile-999" }, // Recipe belongs to 999
        error: null,
      });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      setupMocks("cook", "profile-222", (table) => {
        if (table === "recipes") return { select: mockSelect };
        return {};
      });

      const response = await request(app)
        .post("/recipes/123/publish")
        .set("Authorization", "Bearer valid_token")
        .send();

      expect(response.status).toBe(403);
    });

    it("should return 400 if incomplete (no ingredients)", async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: { 
          creator_id: "profile-123", 
          is_published: false, 
          dish_variety_id: 1,
          serving_size: 4,
          recipe_ingredients: [], 
          recipe_steps: [{id: 1}] 
        },
        error: null,
      });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      setupMocks("expert", "profile-123", (table) => {
        if (table === "recipes") return { select: mockSelect };
        return {};
      });

      const response = await request(app)
        .post("/recipes/123/publish")
        .set("Authorization", "Bearer valid_token")
        .send();

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain("1 ingredient");
    });

    it("should return 400 if incomplete (missing dishVarietyId)", async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: { 
          creator_id: "profile-123", 
          is_published: false, 
          dish_variety_id: null,
          serving_size: 4,
          recipe_ingredients: [{id: 1}], 
          recipe_steps: [{id: 1}] 
        },
        error: null,
      });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      setupMocks("expert", "profile-123", (table) => {
        if (table === "recipes") return { select: mockSelect };
        return {};
      });

      const response = await request(app)
        .post("/recipes/123/publish")
        .set("Authorization", "Bearer valid_token")
        .send();

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain("dish variety");
    });

    it("should return 200 on successful publish", async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: { 
          creator_id: "profile-123", 
          is_published: false, 
          dish_variety_id: 1,
          serving_size: 4,
          recipe_ingredients: [{id: 1}], 
          recipe_steps: [{id: 1}] 
        },
        error: null,
      });
      const mockEqForSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEqForSelect });

      const mockEqForUpdate = jest.fn().mockResolvedValue({ error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEqForUpdate });

      setupMocks("expert", "profile-123", (table) => {
        if (table === "recipes") {
          return { select: mockSelect, update: mockUpdate };
        }
        return {};
      });

      const response = await request(app)
        .post("/recipes/123/publish")
        .set("Authorization", "Bearer valid_token")
        .send();

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isPublished).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({ is_published: true });
    });
  });

  describe("PATCH /recipes/:id", () => {
    it("should return 401 if unauthenticated", async () => {
      const response = await request(app).patch("/recipes/123").send({ title: "Updated" });
      expect(response.status).toBe(401);
    });

    it("should return 404 if recipe not found", async () => {
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      setupMocks("cook", "profile-123", (table) => {
        if (table === "recipes") return { select: mockSelect };
        return {};
      });

      const response = await request(app)
        .patch("/recipes/123")
        .set("Authorization", "Bearer valid")
        .send({ title: "Updated" });

      expect(response.status).toBe(404);
    });

    it("should return 200 on successful update", async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: { creator_id: "profile-123", type: "community" },
        error: null,
      });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      const mockUpdateEq = jest.fn().mockResolvedValue({ error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockUpdateEq });

      // For delete
      const mockDeleteEq = jest.fn().mockResolvedValue({ error: null });
      const mockDelete = jest.fn().mockReturnValue({ eq: mockDeleteEq });

      // For insert
      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      setupMocks("expert", "profile-123", (table) => {
        if (table === "recipes") return { select: mockSelect, update: mockUpdate };
        return { delete: mockDelete, insert: mockInsert };
      });

      const response = await request(app)
        .patch("/recipes/123")
        .set("Authorization", "Bearer valid")
        .send({ title: "Successfully Updated" });

      expect(response.status).toBe(200);
      expect(response.body.data.message).toContain("updated successfully");
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Recipe Rating Endpoints", () => {
  beforeEach(() => jest.clearAllMocks());

  // Reuse the same setupMocks helper pattern from the file top-level mock
  const setupMocks = (
    role: string,
    profileId = "profile-123",
    recipeFromMock?: (table: string) => any
  ) => {
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
      if (recipeFromMock) return recipeFromMock(table);
      return { select: jest.fn(), insert: jest.fn(), upsert: jest.fn(), delete: jest.fn() };
    });
  };

  // ─── Chainable mock helper ─────────────────────────────────────────────────
  const chainable = (resolved: { data: any; error: any }) => {
    const mock: any = {};
    const methods = ["select", "eq", "single", "upsert", "delete", "order"];
    methods.forEach((m) => { mock[m] = jest.fn().mockReturnValue(mock); });
    mock.then = (resolve: any) => Promise.resolve(resolved).then(resolve);
    return mock;
  };

  // ─── POST /recipes/:id/ratings ─────────────────────────────────────────────

  describe("POST /recipes/:id/ratings", () => {
    it("returns 401 when unauthenticated", async () => {
      const res = await request(app)
        .post("/recipes/recipe-1/ratings")
        .send({ score: 4 });
      expect(res.status).toBe(401);
    });

    it("returns 400 for score = 0", async () => {
      setupMocks("cook");
      const res = await request(app)
        .post("/recipes/recipe-1/ratings")
        .set("Authorization", "Bearer valid_token")
        .send({ score: 0 });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 for score = 6", async () => {
      setupMocks("cook");
      const res = await request(app)
        .post("/recipes/recipe-1/ratings")
        .set("Authorization", "Bearer valid_token")
        .send({ score: 6 });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 for non-numeric score", async () => {
      setupMocks("cook");
      const res = await request(app)
        .post("/recipes/recipe-1/ratings")
        .set("Authorization", "Bearer valid_token")
        .send({ score: "great" });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 404 when recipe not found", async () => {
      setupMocks("cook", "profile-123", (table) => {
        if (table === "recipes")
          return chainable({ data: null, error: { code: "PGRST116", message: "Not found" } });
      });

      const res = await request(app)
        .post("/recipes/nonexistent/ratings")
        .set("Authorization", "Bearer valid_token")
        .send({ score: 4 });
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });

    it("returns 403 when rating own recipe", async () => {
      setupMocks("cook", "profile-123", (table) => {
        if (table === "recipes")
          return chainable({ data: { id: "recipe-1", creator_id: "profile-123" }, error: null });
      });

      const res = await request(app)
        .post("/recipes/recipe-1/ratings")
        .set("Authorization", "Bearer valid_token")
        .send({ score: 5 });
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("returns 200 on successful rating (happy path)", async () => {
      const mockRating = {
        id: "rating-1", recipe_id: "recipe-1", profile_id: "profile-123",
        score: 4, created_at: "2024-01-01", updated_at: "2024-01-01",
      };

      setupMocks("cook", "profile-123", (table) => {
        if (table === "recipes")
          return chainable({ data: { id: "recipe-1", creator_id: "profile-999" }, error: null });
        if (table === "ratings")
          return chainable({ data: mockRating, error: null });
      });

      const res = await request(app)
        .post("/recipes/recipe-1/ratings")
        .set("Authorization", "Bearer valid_token")
        .send({ score: 4 });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.score).toBe(4);
    });

    it("allows upsert — same user rating twice returns 200", async () => {
      const mockRating = {
        id: "rating-1", recipe_id: "recipe-1", profile_id: "profile-123",
        score: 5, created_at: "2024-01-01", updated_at: "2024-01-02",
      };

      setupMocks("cook", "profile-123", (table) => {
        if (table === "recipes")
          return chainable({ data: { id: "recipe-1", creator_id: "profile-999" }, error: null });
        if (table === "ratings")
          return chainable({ data: mockRating, error: null });
      });

      const res = await request(app)
        .post("/recipes/recipe-1/ratings")
        .set("Authorization", "Bearer valid_token")
        .send({ score: 5 });
      expect(res.status).toBe(200);
      expect(res.body.data.score).toBe(5);
    });

    it("returns 500 on db error during upsert", async () => {
      setupMocks("cook", "profile-123", (table) => {
        if (table === "recipes")
          return chainable({ data: { id: "recipe-1", creator_id: "profile-999" }, error: null });
        if (table === "ratings")
          return chainable({ data: null, error: { message: "DB timeout" } });
      });

      const res = await request(app)
        .post("/recipes/recipe-1/ratings")
        .set("Authorization", "Bearer valid_token")
        .send({ score: 3 });
      expect(res.status).toBe(500);
      expect(res.body.error.code).toBe("DB_ERROR");
    });
  });

  // ─── GET /recipes/:id/ratings/me ───────────────────────────────────────────

  describe("GET /recipes/:id/ratings/me", () => {
    it("returns 401 when unauthenticated", async () => {
      const res = await request(app).get("/recipes/recipe-1/ratings/me");
      expect(res.status).toBe(401);
    });

    it("returns existing rating when user has rated", async () => {
      const mockRating = { id: "rating-1", score: 4, created_at: "2024-01-01", updated_at: "2024-01-01" };

      setupMocks("cook", "profile-123", (table) => {
        if (table === "ratings")
          return chainable({ data: mockRating, error: null });
      });

      const res = await request(app)
        .get("/recipes/recipe-1/ratings/me")
        .set("Authorization", "Bearer valid_token");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.score).toBe(4);
    });

    it("returns null when user has not rated yet", async () => {
      setupMocks("cook", "profile-123", (table) => {
        if (table === "ratings")
          return chainable({ data: null, error: { code: "PGRST116", message: "Not found" } });
      });

      const res = await request(app)
        .get("/recipes/recipe-1/ratings/me")
        .set("Authorization", "Bearer valid_token");
      expect(res.status).toBe(200);
      expect(res.body.data).toBeNull();
    });

    it("returns 500 on db error", async () => {
      setupMocks("cook", "profile-123", (table) => {
        if (table === "ratings")
          return chainable({ data: null, error: { message: "DB timeout" } });
      });

      const res = await request(app)
        .get("/recipes/recipe-1/ratings/me")
        .set("Authorization", "Bearer valid_token");
      expect(res.status).toBe(500);
      expect(res.body.error.code).toBe("DB_ERROR");
    });
  });

  // ─── DELETE /recipes/:id/ratings/me ────────────────────────────────────────

  describe("DELETE /recipes/:id/ratings/me", () => {
    it("returns 401 when unauthenticated", async () => {
      const res = await request(app).delete("/recipes/recipe-1/ratings/me");
      expect(res.status).toBe(401);
    });

    it("returns 404 when rating does not exist", async () => {
      setupMocks("cook", "profile-123", (table) => {
        if (table === "ratings")
          return chainable({ data: null, error: { code: "PGRST116", message: "Not found" } });
      });

      const res = await request(app)
        .delete("/recipes/recipe-1/ratings/me")
        .set("Authorization", "Bearer valid_token");
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });

    it("returns 204 on successful delete", async () => {
      // First call (select to verify existence) succeeds, second call (delete) succeeds
      let callCount = 0;
      setupMocks("cook", "profile-123", (table) => {
        if (table === "ratings") {
          callCount++;
          if (callCount === 1) return chainable({ data: { id: "rating-1" }, error: null });
          return chainable({ data: null, error: null });
        }
      });

      const res = await request(app)
        .delete("/recipes/recipe-1/ratings/me")
        .set("Authorization", "Bearer valid_token");
      expect(res.status).toBe(204);
    });

    it("returns 500 on db error during delete", async () => {
      let callCount = 0;
      setupMocks("cook", "profile-123", (table) => {
        if (table === "ratings") {
          callCount++;
          if (callCount === 1) return chainable({ data: { id: "rating-1" }, error: null });
          return chainable({ data: null, error: { message: "DB timeout" } });
        }
      });

      const res = await request(app)
        .delete("/recipes/recipe-1/ratings/me")
        .set("Authorization", "Bearer valid_token");
      expect(res.status).toBe(500);
      expect(res.body.error.code).toBe("DB_ERROR");
    });
  });

  // ─── DELETE /recipes/:id ───────────────────────────────────────────────────

  describe("DELETE /recipes/:id", () => {
    it("returns 401 when unauthenticated", async () => {
      const res = await request(app).delete("/recipes/recipe-1");
      expect(res.status).toBe(401);
    });

    it("returns 404 when recipe does not exist", async () => {
      setupMocks("cook", "profile-123", (table) => {
        if (table === "recipes")
          return chainable({ data: null, error: { code: "PGRST116", message: "Not found" } });
      });

      const res = await request(app)
        .delete("/recipes/recipe-1")
        .set("Authorization", "Bearer valid_token");
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });

    it("returns 403 when user is not the creator", async () => {
      setupMocks("cook", "profile-123", (table) => {
        if (table === "recipes")
          return chainable({ data: { id: "recipe-1", creator_id: "other-profile" }, error: null });
      });

      const res = await request(app)
        .delete("/recipes/recipe-1")
        .set("Authorization", "Bearer valid_token");
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("returns 204 on successful delete", async () => {
      let callCount = 0;
      setupMocks("cook", "profile-123", (table) => {
        if (table === "recipes") {
          callCount++;
          if (callCount === 1)
            return chainable({ data: { id: "recipe-1", creator_id: "profile-123" }, error: null });
          return chainable({ data: null, error: null });
        }
      });

      const res = await request(app)
        .delete("/recipes/recipe-1")
        .set("Authorization", "Bearer valid_token");
      expect(res.status).toBe(204);
    });

    it("returns 500 on db error during fetch", async () => {
      setupMocks("cook", "profile-123", (table) => {
        if (table === "recipes")
          return chainable({ data: null, error: { message: "DB timeout" } });
      });

      const res = await request(app)
        .delete("/recipes/recipe-1")
        .set("Authorization", "Bearer valid_token");
      expect(res.status).toBe(500);
      expect(res.body.error.code).toBe("DB_ERROR");
    });

    it("returns 500 on db error during delete", async () => {
      let callCount = 0;
      setupMocks("cook", "profile-123", (table) => {
        if (table === "recipes") {
          callCount++;
          if (callCount === 1)
            return chainable({ data: { id: "recipe-1", creator_id: "profile-123" }, error: null });
          return chainable({ data: null, error: { message: "DB timeout" } });
        }
      });

      const res = await request(app)
        .delete("/recipes/recipe-1")
        .set("Authorization", "Bearer valid_token");
      expect(res.status).toBe(500);
      expect(res.body.error.code).toBe("DB_ERROR");
    });
  });
});
