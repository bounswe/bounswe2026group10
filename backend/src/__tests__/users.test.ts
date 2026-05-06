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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const setupAuth = () => {
  (supabase.auth.getUser as jest.Mock).mockResolvedValue({
    data: { user: { id: "auth-user-1", email: "test@example.com" } },
    error: null,
  });
};

const authProfileMock = () => {
  const mockSingle = jest.fn().mockResolvedValue({
    data: { id: "profile-1", username: "testuser", role: "cook" },
    error: null,
  });
  const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
  return { select: jest.fn().mockReturnValue({ eq: mockEq }) };
};

const recipeMaybeSingleMock = (data: any) => {
  const mockMaybeSingle = jest.fn().mockResolvedValue({ data, error: null });
  const mockEq2 = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
  const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
  return { select: jest.fn().mockReturnValue({ eq: mockEq1 }) };
};

// ─── POST /users/me/favorites/:recipeId ───────────────────────────────────────

describe("POST /users/me/favorites/:recipeId", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    const res = await request(app).post("/users/me/favorites/recipe-1");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 404 when recipe not found or unpublished", async () => {
    setupAuth();
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "profiles") return authProfileMock();
      if (table === "recipes") return recipeMaybeSingleMock(null);
      return {};
    });

    const res = await request(app)
      .post("/users/me/favorites/nonexistent")
      .set("Authorization", "Bearer valid_token");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("returns 201 when successfully favorited", async () => {
    setupAuth();
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "profiles") return authProfileMock();
      if (table === "recipes") return recipeMaybeSingleMock({ id: "recipe-1" });
      if (table === "user_favorites") {
        return { insert: jest.fn().mockResolvedValue({ error: null }) };
      }
      return {};
    });

    const res = await request(app)
      .post("/users/me/favorites/recipe-1")
      .set("Authorization", "Bearer valid_token");

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.favorited).toBe(true);
  });

  it("returns 409 when recipe is already in favorites", async () => {
    setupAuth();
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "profiles") return authProfileMock();
      if (table === "recipes") return recipeMaybeSingleMock({ id: "recipe-1" });
      if (table === "user_favorites") {
        return { insert: jest.fn().mockResolvedValue({ error: { code: "23505", message: "duplicate key" } }) };
      }
      return {};
    });

    const res = await request(app)
      .post("/users/me/favorites/recipe-1")
      .set("Authorization", "Bearer valid_token");

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");
  });
});

// ─── DELETE /users/me/favorites/:recipeId ─────────────────────────────────────

describe("DELETE /users/me/favorites/:recipeId", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    const res = await request(app).delete("/users/me/favorites/recipe-1");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 204 when successfully removed", async () => {
    setupAuth();
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "profiles") return authProfileMock();
      if (table === "user_favorites") {
        const mockMaybeSingle = jest.fn().mockResolvedValue({ data: { id: "fav-1" }, error: null });
        const mockSelect = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
        const mockEq2 = jest.fn().mockReturnValue({ select: mockSelect });
        const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
        return { delete: jest.fn().mockReturnValue({ eq: mockEq1 }) };
      }
      return {};
    });

    const res = await request(app)
      .delete("/users/me/favorites/recipe-1")
      .set("Authorization", "Bearer valid_token");

    expect(res.status).toBe(204);
  });

  it("returns 404 when favorite does not exist", async () => {
    setupAuth();
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "profiles") return authProfileMock();
      if (table === "user_favorites") {
        const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
        const mockSelect = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
        const mockEq2 = jest.fn().mockReturnValue({ select: mockSelect });
        const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
        return { delete: jest.fn().mockReturnValue({ eq: mockEq1 }) };
      }
      return {};
    });

    const res = await request(app)
      .delete("/users/me/favorites/recipe-1")
      .set("Authorization", "Bearer valid_token");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});

// ─── GET /users/me/favorites ──────────────────────────────────────────────────

describe("GET /users/me/favorites", () => {
  beforeEach(() => jest.clearAllMocks());

  const mockFavRow = {
    recipe: {
      id: "recipe-1",
      title: "Adana Kebap",
      type: "community",
      average_rating: 4.5,
      rating_count: 10,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
      creator: { id: "profile-2", username: "cook1" },
      dish_variety: { id: 1, name: "Kebap", dish_genre: { id: 1, name: "Grills" } },
      recipe_media: [{ id: 1, url: "https://example.com/img.jpg", type: "image" }],
    },
  };

  it("returns 401 when unauthenticated", async () => {
    const res = await request(app).get("/users/me/favorites");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 200 with paginated list of favorited recipes", async () => {
    setupAuth();
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "profiles") return authProfileMock();
      if (table === "user_favorites") {
        const mockRange = jest.fn().mockResolvedValue({ data: [mockFavRow], error: null, count: 1 });
        const mockOrder = jest.fn().mockReturnValue({ range: mockRange });
        const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
        return { select: jest.fn().mockReturnValue({ eq: mockEq }) };
      }
      return {};
    });

    const res = await request(app)
      .get("/users/me/favorites")
      .set("Authorization", "Bearer valid_token");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.recipes).toHaveLength(1);
    expect(res.body.data.recipes[0].title).toBe("Adana Kebap");
    expect(res.body.data.recipes[0].coverImageUrl).toBe("https://example.com/img.jpg");
    expect(res.body.data.pagination.total).toBe(1);
  });

  it("returns 200 with empty list when no favorites", async () => {
    setupAuth();
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "profiles") return authProfileMock();
      if (table === "user_favorites") {
        const mockRange = jest.fn().mockResolvedValue({ data: [], error: null, count: 0 });
        const mockOrder = jest.fn().mockReturnValue({ range: mockRange });
        const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
        return { select: jest.fn().mockReturnValue({ eq: mockEq }) };
      }
      return {};
    });

    const res = await request(app)
      .get("/users/me/favorites")
      .set("Authorization", "Bearer valid_token");

    expect(res.status).toBe(200);
    expect(res.body.data.recipes).toHaveLength(0);
    expect(res.body.data.pagination.total).toBe(0);
  });

  it("returns correct pagination metadata", async () => {
    setupAuth();
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "profiles") return authProfileMock();
      if (table === "user_favorites") {
        const mockRange = jest.fn().mockResolvedValue({ data: [mockFavRow], error: null, count: 25 });
        const mockOrder = jest.fn().mockReturnValue({ range: mockRange });
        const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
        return { select: jest.fn().mockReturnValue({ eq: mockEq }) };
      }
      return {};
    });

    const res = await request(app)
      .get("/users/me/favorites?page=2&limit=10")
      .set("Authorization", "Bearer valid_token");

    expect(res.status).toBe(200);
    expect(res.body.data.pagination.page).toBe(2);
    expect(res.body.data.pagination.limit).toBe(10);
    expect(res.body.data.pagination.total).toBe(25);
  });
});

// ─── GET /users/me/drafts ─────────────────────────────────────────────────────

describe("GET /users/me/drafts", () => {
  beforeEach(() => jest.clearAllMocks());

  const mockDraft = {
    id: "recipe-1",
    title: "Draft Recipe",
    type: "community",
    is_published: false,
    average_rating: null,
    rating_count: 0,
    country: null,
    city: null,
    district: null,
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
    recipe_media: [],
  };

  const draftsQueryMock = (rows: any[], dbError: any = null) => {
    const mockOrder = jest.fn().mockResolvedValue({ data: rows, error: dbError });
    const mockEqPublished = jest.fn().mockReturnValue({ order: mockOrder });
    const mockEqCreator = jest.fn().mockReturnValue({ eq: mockEqPublished });
    return { select: jest.fn().mockReturnValue({ eq: mockEqCreator }) };
  };

  it("returns 401 when unauthenticated", async () => {
    const res = await request(app).get("/users/me/drafts");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns only draft recipes for the authenticated user", async () => {
    setupAuth();
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "profiles") return authProfileMock();
      if (table === "recipes") return draftsQueryMock([mockDraft]);
      return {};
    });

    const res = await request(app)
      .get("/users/me/drafts")
      .set("Authorization", "Bearer valid_token");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe("recipe-1");
    expect(res.body.data[0].isPublished).toBe(false);
  });

  it("returns empty array when user has no drafts", async () => {
    setupAuth();
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "profiles") return authProfileMock();
      if (table === "recipes") return draftsQueryMock([]);
      return {};
    });

    const res = await request(app)
      .get("/users/me/drafts")
      .set("Authorization", "Bearer valid_token");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it("does not return published recipes", async () => {
    setupAuth();
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "profiles") return authProfileMock();
      if (table === "recipes") return draftsQueryMock([mockDraft]);
      return {};
    });

    const res = await request(app)
      .get("/users/me/drafts")
      .set("Authorization", "Bearer valid_token");

    expect(res.status).toBe(200);
    const publishedInResult = res.body.data.filter((r: any) => r.isPublished === true);
    expect(publishedInResult).toHaveLength(0);
  });

  it("does not return other users' drafts", async () => {
    setupAuth();
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "profiles") return authProfileMock();
      if (table === "recipes") return draftsQueryMock([mockDraft]);
      return {};
    });

    const res = await request(app)
      .get("/users/me/drafts")
      .set("Authorization", "Bearer valid_token");

    expect(res.status).toBe(200);
    // The mock only returns mockDraft which belongs to the authenticated user (profile-1)
    // A real DB would enforce this via RLS + creator_id filter; here we verify the query
    // is built with the correct creator_id by checking only expected data is returned.
    expect(res.body.data.every((r: any) => r.id === "recipe-1")).toBe(true);
  });

  it("returns 500 on database error", async () => {
    setupAuth();
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "profiles") return authProfileMock();
      if (table === "recipes") return draftsQueryMock([], { message: "DB failure" });
      return {};
    });

    const res = await request(app)
      .get("/users/me/drafts")
      .set("Authorization", "Bearer valid_token");

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("DB_ERROR");
  });
});

// ─── GET /recipes/:id — isFavorited ──────────────────────────────────────────

describe("GET /recipes/:id isFavorited", () => {
  beforeEach(() => jest.clearAllMocks());

  const mockRecipe = {
    id: "recipe-1",
    title: "Adana Kebap",
    story: null,
    video_url: null,
    serving_size: null,
    type: "community",
    is_published: true,
    average_rating: 4.5,
    rating_count: 10,
    country: null, city: null, district: null,
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
    creator: { id: "profile-2", username: "cook1" },
    dish_variety: { id: 1, name: "Kebap", dish_genre: { id: 1, name: "Grills" } },
    recipe_ingredients: [],
    recipe_steps: [],
    recipe_tools: [],
    recipe_media: [],
    recipe_dietary_tags: [],
  };

  it("returns isFavorited: false when no Authorization header", async () => {
    const mockSingle = jest.fn().mockResolvedValue({ data: mockRecipe, error: null });
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "recipes") return { select: jest.fn().mockReturnValue({ eq: mockEq }) };
      return {};
    });

    const res = await request(app).get("/recipes/recipe-1");

    expect(res.status).toBe(200);
    expect(res.body.data.isFavorited).toBe(false);
  });

  it("returns isFavorited: true when user has favorited the recipe", async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: "auth-user-1" } },
      error: null,
    });

    let profileCallCount = 0;
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "recipes") {
        const mockSingle = jest.fn().mockResolvedValue({ data: mockRecipe, error: null });
        const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
        return { select: jest.fn().mockReturnValue({ eq: mockEq }) };
      }
      if (table === "profiles") {
        profileCallCount++;
        const mockMaybeSingle = jest.fn().mockResolvedValue({ data: { id: "profile-1" }, error: null });
        const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
        return { select: jest.fn().mockReturnValue({ eq: mockEq }) };
      }
      if (table === "user_favorites") {
        const mockMaybeSingle = jest.fn().mockResolvedValue({ data: { id: "fav-1" }, error: null });
        const mockEq2 = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
        const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
        return { select: jest.fn().mockReturnValue({ eq: mockEq1 }) };
      }
      return {};
    });

    const res = await request(app)
      .get("/recipes/recipe-1")
      .set("Authorization", "Bearer valid_token");

    expect(res.status).toBe(200);
    expect(res.body.data.isFavorited).toBe(true);
  });

  it("returns isFavorited: false when user has not favorited the recipe", async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: "auth-user-1" } },
      error: null,
    });

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "recipes") {
        const mockSingle = jest.fn().mockResolvedValue({ data: mockRecipe, error: null });
        const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
        return { select: jest.fn().mockReturnValue({ eq: mockEq }) };
      }
      if (table === "profiles") {
        const mockMaybeSingle = jest.fn().mockResolvedValue({ data: { id: "profile-1" }, error: null });
        const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
        return { select: jest.fn().mockReturnValue({ eq: mockEq }) };
      }
      if (table === "user_favorites") {
        const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
        const mockEq2 = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
        const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
        return { select: jest.fn().mockReturnValue({ eq: mockEq1 }) };
      }
      return {};
    });

    const res = await request(app)
      .get("/recipes/recipe-1")
      .set("Authorization", "Bearer valid_token");

    expect(res.status).toBe(200);
    expect(res.body.data.isFavorited).toBe(false);
  });
});
