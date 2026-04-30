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

// ─── Shared helpers ──────────────────────────────────────────────────────────

const setupAuth = (role = "cook", profileId = "profile-123", username = "tester") => {
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
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      return { select: jest.fn().mockReturnValue({ eq: mockEq }) };
    }
    return { select: jest.fn(), insert: jest.fn(), delete: jest.fn(), update: jest.fn(), upsert: jest.fn() };
  });
};

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
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      return { select: jest.fn().mockReturnValue({ eq: mockEq }) };
    }
    return tableMock(table);
  });
};

const chainable = (resolved: { data: any; error: any; count?: number | null }) => {
  const mock: any = {};
  const methods = ["select", "eq", "single", "insert", "delete", "update", "upsert", "order", "range"];
  methods.forEach((m) => {
    mock[m] = jest.fn().mockReturnValue(mock);
  });
  mock.then = (resolve: any) => Promise.resolve(resolved).then(resolve);
  return mock;
};

const okComment = {
  id: "comment-1",
  recipe_id: "recipe-1",
  user_id: "profile-123",
  text: "Great recipe!",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const okRating = {
  id: "rating-1",
  score: 4,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

// ─── POST /recipes/:id/comments ──────────────────────────────────────────────

describe("POST /recipes/:id/comments", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    const res = await request(app)
      .post("/recipes/recipe-1/comments")
      .send({ body: "Looks delicious!" });
    expect(res.status).toBe(401);
  });

  it("returns 400 when body is empty", async () => {
    setupAuth("cook");
    const res = await request(app)
      .post("/recipes/recipe-1/comments")
      .set("Authorization", "Bearer valid_token")
      .send({ body: "" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when body is missing", async () => {
    setupAuth("cook");
    const res = await request(app)
      .post("/recipes/recipe-1/comments")
      .set("Authorization", "Bearer valid_token")
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when body exceeds 2000 characters", async () => {
    setupAuth("cook");
    const longBody = "a".repeat(2001);
    const res = await request(app)
      .post("/recipes/recipe-1/comments")
      .set("Authorization", "Bearer valid_token")
      .send({ body: longBody });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when score is out of range", async () => {
    setupAuth("cook");
    const res = await request(app)
      .post("/recipes/recipe-1/comments")
      .set("Authorization", "Bearer valid_token")
      .send({ body: "Hi", score: 6 });
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
      .post("/recipes/missing/comments")
      .set("Authorization", "Bearer valid_token")
      .send({ body: "Hi" });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("returns 400 RATING_REQUIRED when no score and no existing rating", async () => {
    setupAuthAndTables("cook", "profile-123", (table) => {
      if (table === "recipes")
        return chainable({ data: { id: "recipe-1", creator_id: "creator-999" }, error: null });
      if (table === "ratings")
        return chainable({ data: null, error: { code: "PGRST116", message: "Not found" } });
      return chainable({ data: null, error: null });
    });

    const res = await request(app)
      .post("/recipes/recipe-1/comments")
      .set("Authorization", "Bearer valid_token")
      .send({ body: "Looks great" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("RATING_REQUIRED");
  });

  it("returns 201 when score is provided (upserts rating + creates comment)", async () => {
    const ratingsMock = chainable({ data: okRating, error: null });
    const commentsMock = chainable({ data: okComment, error: null });

    setupAuthAndTables("cook", "profile-123", (table) => {
      if (table === "recipes")
        return chainable({ data: { id: "recipe-1", creator_id: "creator-999" }, error: null });
      if (table === "ratings") return ratingsMock;
      if (table === "comments") return commentsMock;
      return chainable({ data: null, error: null });
    });

    const res = await request(app)
      .post("/recipes/recipe-1/comments")
      .set("Authorization", "Bearer valid_token")
      .send({ body: "Great recipe!", score: 4 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.comment).toMatchObject({
      id: "comment-1",
      recipeId: "recipe-1",
      userId: "profile-123",
      username: "tester",
      body: "Great recipe!",
    });
    expect(res.body.data.rating).toMatchObject({ id: "rating-1", score: 4 });
    expect(ratingsMock.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        recipe_id: "recipe-1",
        user_id: "profile-123",
        score: 4,
      }),
      expect.objectContaining({ onConflict: "recipe_id,user_id" })
    );
  });

  it("returns 201 when no score but existing rating found", async () => {
    setupAuthAndTables("cook", "profile-123", (table) => {
      if (table === "recipes")
        return chainable({ data: { id: "recipe-1", creator_id: "creator-999" }, error: null });
      if (table === "ratings") return chainable({ data: okRating, error: null });
      if (table === "comments") return chainable({ data: okComment, error: null });
      return chainable({ data: null, error: null });
    });

    const res = await request(app)
      .post("/recipes/recipe-1/comments")
      .set("Authorization", "Bearer valid_token")
      .send({ body: "Tried it again, still tasty." });

    expect(res.status).toBe(201);
    expect(res.body.data.comment.id).toBe("comment-1");
    expect(res.body.data.rating).toMatchObject({ id: "rating-1", score: 4 });
  });

  it("returns 403 when creator includes a score (self-rating forbidden)", async () => {
    setupAuthAndTables("cook", "profile-123", (table) => {
      if (table === "recipes")
        return chainable({ data: { id: "recipe-1", creator_id: "profile-123" }, error: null });
      return chainable({ data: null, error: null });
    });

    const res = await request(app)
      .post("/recipes/recipe-1/comments")
      .set("Authorization", "Bearer valid_token")
      .send({ body: "Author note", score: 5 });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("returns 201 when creator comments on own recipe without a score (no rating required)", async () => {
    setupAuthAndTables("cook", "profile-123", (table) => {
      if (table === "recipes")
        return chainable({ data: { id: "recipe-1", creator_id: "profile-123" }, error: null });
      if (table === "comments") return chainable({ data: okComment, error: null });
      return chainable({ data: null, error: null });
    });

    const res = await request(app)
      .post("/recipes/recipe-1/comments")
      .set("Authorization", "Bearer valid_token")
      .send({ body: "Author follow-up" });

    expect(res.status).toBe(201);
    expect(res.body.data.comment.id).toBe("comment-1");
    expect(res.body.data.rating).toBeNull();
  });

  it("returns 500 on db error during comment insert", async () => {
    setupAuthAndTables("cook", "profile-123", (table) => {
      if (table === "recipes")
        return chainable({ data: { id: "recipe-1", creator_id: "creator-999" }, error: null });
      if (table === "ratings") return chainable({ data: okRating, error: null });
      if (table === "comments") return chainable({ data: null, error: { message: "DB timeout" } });
      return chainable({ data: null, error: null });
    });

    const res = await request(app)
      .post("/recipes/recipe-1/comments")
      .set("Authorization", "Bearer valid_token")
      .send({ body: "Hello" });

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("DB_ERROR");
  });

  it("returns 500 on db error during rating upsert", async () => {
    setupAuthAndTables("cook", "profile-123", (table) => {
      if (table === "recipes")
        return chainable({ data: { id: "recipe-1", creator_id: "creator-999" }, error: null });
      if (table === "ratings") return chainable({ data: null, error: { message: "DB timeout" } });
      return chainable({ data: null, error: null });
    });

    const res = await request(app)
      .post("/recipes/recipe-1/comments")
      .set("Authorization", "Bearer valid_token")
      .send({ body: "Hello", score: 5 });

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("DB_ERROR");
  });
});

// ─── GET /recipes/:id/comments ───────────────────────────────────────────────

describe("GET /recipes/:id/comments", () => {
  beforeEach(() => jest.clearAllMocks());

  const setupListMock = (data: any, error: any = null, count: number | null = null) => {
    const chain: any = {};
    chain.select = jest.fn().mockReturnValue(chain);
    chain.eq = jest.fn().mockReturnValue(chain);
    chain.order = jest.fn().mockReturnValue(chain);
    chain.range = jest.fn().mockResolvedValue({ data, error, count });
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "comments") return chain;
      return {};
    });
    return chain;
  };

  const sampleComments = [
    {
      id: "c2",
      recipe_id: "recipe-1",
      user_id: "profile-2",
      text: "Made this yesterday — turned out great.",
      created_at: "2024-02-02T00:00:00Z",
      updated_at: "2024-02-02T00:00:00Z",
      author: { id: "profile-2", username: "ayse" },
    },
    {
      id: "c1",
      recipe_id: "recipe-1",
      user_id: "profile-1",
      text: "Looks tasty!",
      created_at: "2024-02-01T00:00:00Z",
      updated_at: "2024-02-01T00:00:00Z",
      author: { id: "profile-1", username: "furkan" },
    },
  ];

  it("returns 200 with paginated comments", async () => {
    setupListMock(sampleComments, null, 2);
    const res = await request(app).get("/recipes/recipe-1/comments");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.comments).toHaveLength(2);
    expect(res.body.data.pagination).toMatchObject({ page: 1, limit: 20, total: 2 });
  });

  it("returns the response shape with username from joined profile", async () => {
    setupListMock([sampleComments[0]], null, 1);
    const res = await request(app).get("/recipes/recipe-1/comments");
    expect(res.status).toBe(200);
    expect(res.body.data.comments[0]).toMatchObject({
      id: "c2",
      recipeId: "recipe-1",
      userId: "profile-2",
      username: "ayse",
      body: "Made this yesterday — turned out great.",
    });
  });

  it("supports pagination query params", async () => {
    const chain = setupListMock([], null, 0);
    const res = await request(app).get("/recipes/recipe-1/comments?page=2&limit=5");
    expect(res.status).toBe(200);
    expect(chain.range).toHaveBeenCalledWith(5, 9);
  });

  it("returns empty array when recipe has no comments", async () => {
    setupListMock([], null, 0);
    const res = await request(app).get("/recipes/recipe-1/comments");
    expect(res.status).toBe(200);
    expect(res.body.data.comments).toHaveLength(0);
    expect(res.body.data.pagination.total).toBe(0);
  });

  it("returns 400 for invalid page param", async () => {
    const res = await request(app).get("/recipes/recipe-1/comments?page=0");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 500 on database error", async () => {
    setupListMock(null, { message: "DB timeout" });
    const res = await request(app).get("/recipes/recipe-1/comments");
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("DB_ERROR");
  });
});

// ─── PATCH /comments/:id ─────────────────────────────────────────────────────

describe("PATCH /comments/:id", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    const res = await request(app).patch("/comments/comment-1").send({ body: "edit" });
    expect(res.status).toBe(401);
  });

  it("returns 400 when body is empty", async () => {
    setupAuth("cook");
    const res = await request(app)
      .patch("/comments/comment-1")
      .set("Authorization", "Bearer valid_token")
      .send({ body: "" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 when comment does not exist", async () => {
    setupAuthAndTables("cook", "profile-123", (table) => {
      if (table === "comments")
        return chainable({ data: null, error: { code: "PGRST116", message: "Not found" } });
      return chainable({ data: null, error: null });
    });

    const res = await request(app)
      .patch("/comments/missing")
      .set("Authorization", "Bearer valid_token")
      .send({ body: "edit" });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("returns 403 when user is not the author", async () => {
    setupAuthAndTables("cook", "profile-123", (table) => {
      if (table === "comments")
        return chainable({
          data: { id: "comment-1", user_id: "different-profile" },
          error: null,
        });
      return chainable({ data: null, error: null });
    });

    const res = await request(app)
      .patch("/comments/comment-1")
      .set("Authorization", "Bearer valid_token")
      .send({ body: "edit" });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("returns 200 with the updated comment when author edits", async () => {
    let callCount = 0;
    setupAuthAndTables("cook", "profile-123", (table) => {
      if (table === "comments") {
        callCount++;
        if (callCount === 1)
          return chainable({
            data: { id: "comment-1", user_id: "profile-123" },
            error: null,
          });
        return chainable({
          data: {
            id: "comment-1",
            recipe_id: "recipe-1",
            user_id: "profile-123",
            text: "updated body",
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-02T00:00:00Z",
          },
          error: null,
        });
      }
      return chainable({ data: null, error: null });
    });

    const res = await request(app)
      .patch("/comments/comment-1")
      .set("Authorization", "Bearer valid_token")
      .send({ body: "updated body" });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      id: "comment-1",
      recipeId: "recipe-1",
      userId: "profile-123",
      username: "tester",
      body: "updated body",
    });
    expect(res.body.data.updatedAt).not.toEqual(res.body.data.createdAt);
  });
});

// ─── DELETE /comments/:id ────────────────────────────────────────────────────

describe("DELETE /comments/:id", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    const res = await request(app).delete("/comments/comment-1");
    expect(res.status).toBe(401);
  });

  it("returns 404 when comment does not exist", async () => {
    setupAuthAndTables("cook", "profile-123", (table) => {
      if (table === "comments")
        return chainable({ data: null, error: { code: "PGRST116", message: "Not found" } });
      return chainable({ data: null, error: null });
    });

    const res = await request(app)
      .delete("/comments/missing")
      .set("Authorization", "Bearer valid_token");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("returns 403 when user is not the author", async () => {
    setupAuthAndTables("cook", "profile-123", (table) => {
      if (table === "comments")
        return chainable({
          data: { id: "comment-1", user_id: "different-profile" },
          error: null,
        });
      return chainable({ data: null, error: null });
    });

    const res = await request(app)
      .delete("/comments/comment-1")
      .set("Authorization", "Bearer valid_token");

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("returns 204 when author deletes their own comment", async () => {
    let callCount = 0;
    setupAuthAndTables("cook", "profile-123", (table) => {
      if (table === "comments") {
        callCount++;
        if (callCount === 1)
          return chainable({
            data: { id: "comment-1", user_id: "profile-123" },
            error: null,
          });
        return chainable({ data: null, error: null });
      }
      return chainable({ data: null, error: null });
    });

    const res = await request(app)
      .delete("/comments/comment-1")
      .set("Authorization", "Bearer valid_token");

    expect(res.status).toBe(204);
  });

  it("returns 500 on db error during fetch", async () => {
    setupAuthAndTables("cook", "profile-123", (table) => {
      if (table === "comments")
        return chainable({ data: null, error: { message: "DB timeout" } });
      return chainable({ data: null, error: null });
    });

    const res = await request(app)
      .delete("/comments/comment-1")
      .set("Authorization", "Bearer valid_token");

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("DB_ERROR");
  });

  it("returns 500 on db error during delete", async () => {
    let callCount = 0;
    setupAuthAndTables("cook", "profile-123", (table) => {
      if (table === "comments") {
        callCount++;
        if (callCount === 1)
          return chainable({
            data: { id: "comment-1", user_id: "profile-123" },
            error: null,
          });
        return chainable({ data: null, error: { message: "DB timeout" } });
      }
      return chainable({ data: null, error: null });
    });

    const res = await request(app)
      .delete("/comments/comment-1")
      .set("Authorization", "Bearer valid_token");

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("DB_ERROR");
  });
});
