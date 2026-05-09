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

// ─── Helpers (mirrors the pattern in comments.test.ts) ──────────────────────

const setupAuthAndTables = (
  role: string,
  profileId: string,
  tableMock: (table: string) => any,
  username = "tester"
) => {
  (supabase.auth.getUser as jest.Mock).mockResolvedValue({
    data: { user: { id: "user-123", email: "test@example.com" } },
    error: null,
  });

  (supabase.from as jest.Mock).mockImplementation((table) => {
    if (table === "profiles") {
      const mockSingle = jest.fn().mockResolvedValue({
        data: { id: profileId, username, role },
        error: null,
      });
      const mockMaybeSingle = jest.fn().mockResolvedValue({
        data: { id: profileId },
        error: null,
      });
      const mockEq = jest.fn().mockReturnValue({
        single: mockSingle,
        maybeSingle: mockMaybeSingle,
      });
      return { select: jest.fn().mockReturnValue({ eq: mockEq }) };
    }
    return tableMock(table);
  });
};

const chainable = (resolved: { data: any; error: any; count?: number | null }) => {
  const mock: any = {};
  const methods = [
    "select",
    "eq",
    "single",
    "maybeSingle",
    "insert",
    "delete",
    "update",
    "order",
  ];
  methods.forEach((m) => {
    mock[m] = jest.fn().mockReturnValue(mock);
  });
  mock.then = (resolve: any) => Promise.resolve(resolved).then(resolve);
  return mock;
};

const okAnnotation = {
  id: 7,
  recipe_id: "recipe-1",
  start_time: 42.5,
  end_time: 56.78,
  note: "Putting the chicken in the oven",
  technique: null,
  created_at: "2026-05-09T00:00:00Z",
};

// ─── POST /recipes/:id/annotations ───────────────────────────────────────────

describe("POST /recipes/:id/annotations", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    const res = await request(app)
      .post("/recipes/recipe-1/annotations")
      .send({ startTime: 10, endTime: 20, note: "Step note" });
    expect(res.status).toBe(401);
  });

  it("returns 403 when caller is a learner", async () => {
    setupAuthAndTables("learner", "profile-123", () => chainable({ data: null, error: null }));
    const res = await request(app)
      .post("/recipes/recipe-1/annotations")
      .set("Authorization", "Bearer valid_token")
      .send({ startTime: 10, endTime: 20, note: "Step note" });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("returns 400 when startTime is negative", async () => {
    setupAuthAndTables("cook", "profile-123", () => chainable({ data: null, error: null }));
    const res = await request(app)
      .post("/recipes/recipe-1/annotations")
      .set("Authorization", "Bearer valid_token")
      .send({ startTime: -1, endTime: 5, note: "Step note" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when endTime is before startTime", async () => {
    setupAuthAndTables("cook", "profile-123", () => chainable({ data: null, error: null }));
    const res = await request(app)
      .post("/recipes/recipe-1/annotations")
      .set("Authorization", "Bearer valid_token")
      .send({ startTime: 30, endTime: 20, note: "Step note" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when endTime is missing", async () => {
    setupAuthAndTables("cook", "profile-123", () => chainable({ data: null, error: null }));
    const res = await request(app)
      .post("/recipes/recipe-1/annotations")
      .set("Authorization", "Bearer valid_token")
      .send({ startTime: 10, note: "Step note" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when note is empty", async () => {
    setupAuthAndTables("cook", "profile-123", () => chainable({ data: null, error: null }));
    const res = await request(app)
      .post("/recipes/recipe-1/annotations")
      .set("Authorization", "Bearer valid_token")
      .send({ startTime: 10, endTime: 20, note: "" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when note exceeds 500 characters", async () => {
    setupAuthAndTables("cook", "profile-123", () => chainable({ data: null, error: null }));
    const res = await request(app)
      .post("/recipes/recipe-1/annotations")
      .set("Authorization", "Bearer valid_token")
      .send({ startTime: 10, endTime: 20, note: "x".repeat(501) });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 when recipe does not exist", async () => {
    setupAuthAndTables("cook", "profile-123", (table) => {
      if (table === "recipes")
        return chainable({ data: null, error: { code: "PGRST116", message: "Not found" } });
      return chainable({ data: null, error: null });
    });

    const res = await request(app)
      .post("/recipes/missing/annotations")
      .set("Authorization", "Bearer valid_token")
      .send({ startTime: 10, endTime: 20, note: "Step note" });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("returns 403 when caller is not the creator", async () => {
    setupAuthAndTables("cook", "profile-123", (table) => {
      if (table === "recipes")
        return chainable({
          data: { id: "recipe-1", creator_id: "someone-else" },
          error: null,
        });
      return chainable({ data: null, error: null });
    });

    const res = await request(app)
      .post("/recipes/recipe-1/annotations")
      .set("Authorization", "Bearer valid_token")
      .send({ startTime: 10, endTime: 20, note: "Step note" });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("returns 201 with normalized payload when creator adds an annotation", async () => {
    const insertMock = chainable({ data: okAnnotation, error: null });

    setupAuthAndTables("cook", "profile-123", (table) => {
      if (table === "recipes")
        return chainable({
          data: { id: "recipe-1", creator_id: "profile-123" },
          error: null,
        });
      if (table === "video_annotations") return insertMock;
      return chainable({ data: null, error: null });
    });

    const res = await request(app)
      .post("/recipes/recipe-1/annotations")
      .set("Authorization", "Bearer valid_token")
      .send({
        startTime: 42.5,
        endTime: 56.78,
        note: "Putting the chicken in the oven",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      id: 7,
      recipeId: "recipe-1",
      startTime: 42.5,
      endTime: 56.78,
      note: "Putting the chicken in the oven",
      technique: null,
    });
    expect(insertMock.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        recipe_id: "recipe-1",
        start_time: 42.5,
        end_time: 56.78,
        note: "Putting the chicken in the oven",
        technique: null,
      })
    );
  });

  it("stores technique when provided", async () => {
    const insertMock = chainable({
      data: { ...okAnnotation, technique: "Searing" },
      error: null,
    });

    setupAuthAndTables("expert", "profile-123", (table) => {
      if (table === "recipes")
        return chainable({
          data: { id: "recipe-1", creator_id: "profile-123" },
          error: null,
        });
      if (table === "video_annotations") return insertMock;
      return chainable({ data: null, error: null });
    });

    const res = await request(app)
      .post("/recipes/recipe-1/annotations")
      .set("Authorization", "Bearer valid_token")
      .send({
        startTime: 10,
        endTime: 14,
        note: "Sear both sides",
        technique: "Searing",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.technique).toBe("Searing");
    expect(insertMock.insert).toHaveBeenCalledWith(
      expect.objectContaining({ technique: "Searing" })
    );
  });
});

// ─── GET /recipes/:id/annotations ────────────────────────────────────────────

describe("GET /recipes/:id/annotations", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 404 when recipe does not exist", async () => {
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "recipes")
        return chainable({ data: null, error: { code: "PGRST116", message: "Not found" } });
      return chainable({ data: null, error: null });
    });

    const res = await request(app).get("/recipes/missing/annotations");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("returns 403 for an unauthenticated viewer on a draft recipe", async () => {
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "recipes")
        return chainable({
          data: { id: "recipe-1", is_published: false, creator_id: "creator-1" },
          error: null,
        });
      return chainable({ data: null, error: null });
    });

    const res = await request(app).get("/recipes/recipe-1/annotations");
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("returns annotations sorted by startTime asc when published", async () => {
    const rows = [
      {
        id: 2,
        recipe_id: "recipe-1",
        start_time: 5,
        end_time: 12,
        note: "Mix",
        technique: null,
        created_at: "t1",
      },
      {
        id: 3,
        recipe_id: "recipe-1",
        start_time: 30,
        end_time: 90,
        note: "Bake",
        technique: null,
        created_at: "t2",
      },
    ];

    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "recipes")
        return chainable({
          data: { id: "recipe-1", is_published: true, creator_id: "creator-1" },
          error: null,
        });
      if (table === "video_annotations") return chainable({ data: rows, error: null });
      return chainable({ data: null, error: null });
    });

    const res = await request(app).get("/recipes/recipe-1/annotations");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0]).toMatchObject({
      id: 2,
      recipeId: "recipe-1",
      startTime: 5,
      endTime: 12,
      note: "Mix",
      technique: null,
    });
  });

  it("returns empty array when no annotations exist", async () => {
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "recipes")
        return chainable({
          data: { id: "recipe-1", is_published: true, creator_id: "creator-1" },
          error: null,
        });
      if (table === "video_annotations") return chainable({ data: [], error: null });
      return chainable({ data: null, error: null });
    });

    const res = await request(app).get("/recipes/recipe-1/annotations");
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

// ─── PATCH /annotations/:annotationId ────────────────────────────────────────

describe("PATCH /annotations/:annotationId", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    const res = await request(app).patch("/annotations/7").send({ note: "Updated" });
    expect(res.status).toBe(401);
  });

  it("returns 400 when no fields provided", async () => {
    setupAuthAndTables("cook", "profile-123", () => chainable({ data: null, error: null }));
    const res = await request(app)
      .patch("/annotations/7")
      .set("Authorization", "Bearer valid_token")
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 when annotation does not exist", async () => {
    setupAuthAndTables("cook", "profile-123", (table) => {
      if (table === "video_annotations")
        return chainable({ data: null, error: { code: "PGRST116", message: "Not found" } });
      return chainable({ data: null, error: null });
    });

    const res = await request(app)
      .patch("/annotations/9999")
      .set("Authorization", "Bearer valid_token")
      .send({ note: "Updated" });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("returns 403 when caller is not the recipe creator", async () => {
    setupAuthAndTables("cook", "profile-123", (table) => {
      if (table === "video_annotations")
        return chainable({
          data: {
            id: 7,
            recipe_id: "recipe-1",
            start_time: 10,
            end_time: 20,
            recipe: { creator_id: "someone-else" },
          },
          error: null,
        });
      return chainable({ data: null, error: null });
    });

    const res = await request(app)
      .patch("/annotations/7")
      .set("Authorization", "Bearer valid_token")
      .send({ note: "Updated" });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("returns 400 when patched endTime falls below existing startTime", async () => {
    setupAuthAndTables("cook", "profile-123", (table) => {
      if (table === "video_annotations")
        return chainable({
          data: {
            id: 7,
            recipe_id: "recipe-1",
            start_time: 50,
            end_time: 60,
            recipe: { creator_id: "profile-123" },
          },
          error: null,
        });
      return chainable({ data: null, error: null });
    });

    const res = await request(app)
      .patch("/annotations/7")
      .set("Authorization", "Bearer valid_token")
      .send({ endTime: 40 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 200 with updated payload when creator edits the range", async () => {
    let videoAnnotationsCallCount = 0;
    setupAuthAndTables("cook", "profile-123", (table) => {
      if (table === "video_annotations") {
        videoAnnotationsCallCount++;
        if (videoAnnotationsCallCount === 1) {
          // Ownership-check fetch
          return chainable({
            data: {
              id: 7,
              recipe_id: "recipe-1",
              start_time: 42.5,
              end_time: 56.78,
              recipe: { creator_id: "profile-123" },
            },
            error: null,
          });
        }
        // Update
        return chainable({
          data: {
            ...okAnnotation,
            note: "Updated note",
            start_time: 60,
            end_time: 75,
          },
          error: null,
        });
      }
      return chainable({ data: null, error: null });
    });

    const res = await request(app)
      .patch("/annotations/7")
      .set("Authorization", "Bearer valid_token")
      .send({ note: "Updated note", startTime: 60, endTime: 75 });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      id: 7,
      note: "Updated note",
      startTime: 60,
      endTime: 75,
    });
  });
});

// ─── DELETE /annotations/:annotationId ───────────────────────────────────────

describe("DELETE /annotations/:annotationId", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    const res = await request(app).delete("/annotations/7");
    expect(res.status).toBe(401);
  });

  it("returns 404 when annotation does not exist", async () => {
    setupAuthAndTables("cook", "profile-123", (table) => {
      if (table === "video_annotations")
        return chainable({ data: null, error: { code: "PGRST116", message: "Not found" } });
      return chainable({ data: null, error: null });
    });

    const res = await request(app)
      .delete("/annotations/9999")
      .set("Authorization", "Bearer valid_token");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("returns 403 when caller is not the recipe creator", async () => {
    setupAuthAndTables("cook", "profile-123", (table) => {
      if (table === "video_annotations")
        return chainable({
          data: {
            id: 7,
            recipe_id: "recipe-1",
            recipe: { creator_id: "someone-else" },
          },
          error: null,
        });
      return chainable({ data: null, error: null });
    });

    const res = await request(app)
      .delete("/annotations/7")
      .set("Authorization", "Bearer valid_token");

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("returns 204 when creator deletes their own annotation", async () => {
    let videoAnnotationsCallCount = 0;
    setupAuthAndTables("cook", "profile-123", (table) => {
      if (table === "video_annotations") {
        videoAnnotationsCallCount++;
        if (videoAnnotationsCallCount === 1) {
          return chainable({
            data: {
              id: 7,
              recipe_id: "recipe-1",
              recipe: { creator_id: "profile-123" },
            },
            error: null,
          });
        }
        return chainable({ data: null, error: null });
      }
      return chainable({ data: null, error: null });
    });

    const res = await request(app)
      .delete("/annotations/7")
      .set("Authorization", "Bearer valid_token");

    expect(res.status).toBe(204);
  });
});
